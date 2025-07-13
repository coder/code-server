package db

import (
	"context"
	"encoding"
	"fmt"
	"reflect"

	"gorm.io/gorm/schema"
)

// Got from https://github.com/xdg-go/strum/blob/main/types.go
var textUnmarshalerType = reflect.TypeOf((*encoding.TextUnmarshaler)(nil)).Elem()

func isTextUnmarshaler(rv reflect.Value) bool {
	return rv.Type().Implements(textUnmarshalerType)
}

func maybeInstantiatePtr(rv reflect.Value) {
	if rv.Kind() == reflect.Ptr && rv.IsNil() {
		np := reflect.New(rv.Type().Elem())
		rv.Set(np)
	}
}

func decodingError(name string, err error) error {
	return fmt.Errorf("error decoding to %s: %w", name, err)
}

// TextSerialiser implements the Serialiser interface for fields that
// have a type that implements encoding.TextUnmarshaler.
type TextSerialiser struct{}

func (TextSerialiser) Scan(ctx context.Context, field *schema.Field, dst reflect.Value, dbValue interface{}) (err error) {
	fieldValue := reflect.New(field.FieldType)

	// If the field is a pointer, we need to dereference it to get the actual type
	// so we do not end with a second pointer.
	if fieldValue.Elem().Kind() == reflect.Ptr {
		fieldValue = fieldValue.Elem()
	}

	if dbValue != nil {
		var bytes []byte
		switch v := dbValue.(type) {
		case []byte:
			bytes = v
		case string:
			bytes = []byte(v)
		default:
			return fmt.Errorf("failed to unmarshal text value: %#v", dbValue)
		}

		if isTextUnmarshaler(fieldValue) {
			maybeInstantiatePtr(fieldValue)
			f := fieldValue.MethodByName("UnmarshalText")
			args := []reflect.Value{reflect.ValueOf(bytes)}
			ret := f.Call(args)
			if !ret[0].IsNil() {
				return decodingError(field.Name, ret[0].Interface().(error))
			}

			// If the underlying field is to a pointer type, we need to
			// assign the value as a pointer to it.
			// If it is not a pointer, we need to assign the value to the
			// field.
			dstField := field.ReflectValueOf(ctx, dst)
			if dstField.Kind() == reflect.Ptr {
				dstField.Set(fieldValue)
			} else {
				dstField.Set(fieldValue.Elem())
			}

			return nil
		} else {
			return fmt.Errorf("unsupported type: %T", fieldValue.Interface())
		}
	}

	return err
}

func (TextSerialiser) Value(ctx context.Context, field *schema.Field, dst reflect.Value, fieldValue interface{}) (interface{}, error) {
	switch v := fieldValue.(type) {
	case encoding.TextMarshaler:
		// If the value is nil, we return nil, however, go nil values are not
		// always comparable, particularly when reflection is involved:
		// https://dev.to/arxeiss/in-go-nil-is-not-equal-to-nil-sometimes-jn8
		if v == nil || (reflect.ValueOf(v).Kind() == reflect.Ptr && reflect.ValueOf(v).IsNil()) {
			return nil, nil
		}
		b, err := v.MarshalText()
		if err != nil {
			return nil, err
		}

		return string(b), nil
	default:
		return nil, fmt.Errorf("only encoding.TextMarshaler is supported, got %t", v)
	}
}
