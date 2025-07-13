package util

import (
	"context"
	"errors"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
	"tailscale.com/types/logger"
)

func LogErr(err error, msg string) {
	log.Error().Caller().Err(err).Msg(msg)
}

func TSLogfWrapper() logger.Logf {
	return func(format string, args ...any) {
		log.Debug().Caller().Msgf(format, args...)
	}
}

type DBLogWrapper struct {
	Logger                *zerolog.Logger
	Level                 zerolog.Level
	Event                 *zerolog.Event
	SlowThreshold         time.Duration
	SkipErrRecordNotFound bool
	ParameterizedQueries  bool
}

func NewDBLogWrapper(origin *zerolog.Logger, slowThreshold time.Duration, skipErrRecordNotFound bool, parameterizedQueries bool) *DBLogWrapper {
	l := &DBLogWrapper{
		Logger:                origin,
		Level:                 origin.GetLevel(),
		SlowThreshold:         slowThreshold,
		SkipErrRecordNotFound: skipErrRecordNotFound,
		ParameterizedQueries:  parameterizedQueries,
	}

	return l
}

type DBLogWrapperOption func(*DBLogWrapper)

func (l *DBLogWrapper) LogMode(gormLogger.LogLevel) gormLogger.Interface {
	return l
}

func (l *DBLogWrapper) Info(ctx context.Context, msg string, data ...interface{}) {
	l.Logger.Info().Msgf(msg, data...)
}

func (l *DBLogWrapper) Warn(ctx context.Context, msg string, data ...interface{}) {
	l.Logger.Warn().Msgf(msg, data...)
}

func (l *DBLogWrapper) Error(ctx context.Context, msg string, data ...interface{}) {
	l.Logger.Error().Msgf(msg, data...)
}

func (l *DBLogWrapper) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	elapsed := time.Since(begin)
	sql, rowsAffected := fc()
	fields := map[string]interface{}{
		"duration":     elapsed,
		"sql":          sql,
		"rowsAffected": rowsAffected,
	}

	if err != nil && (!errors.Is(err, gorm.ErrRecordNotFound) || !l.SkipErrRecordNotFound) {
		l.Logger.Error().Err(err).Fields(fields).Msgf("")
		return
	}

	if l.SlowThreshold != 0 && elapsed > l.SlowThreshold {
		l.Logger.Warn().Fields(fields).Msgf("")
		return
	}

	l.Logger.Debug().Fields(fields).Msgf("")
}

func (l *DBLogWrapper) ParamsFilter(ctx context.Context, sql string, params ...interface{}) (string, []interface{}) {
	if l.ParameterizedQueries {
		return sql, nil
	}
	return sql, params
}
