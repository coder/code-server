package hscontrol

import "testing"

func Test_validateTag(t *testing.T) {
	type args struct {
		tag string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name:    "valid tag",
			args:    args{tag: "tag:test"},
			wantErr: false,
		},
		{
			name:    "tag without tag prefix",
			args:    args{tag: "test"},
			wantErr: true,
		},
		{
			name:    "uppercase tag",
			args:    args{tag: "tag:tEST"},
			wantErr: true,
		},
		{
			name:    "tag that contains space",
			args:    args{tag: "tag:this is a spaced tag"},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := validateTag(tt.args.tag); (err != nil) != tt.wantErr {
				t.Errorf("validateTag() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
