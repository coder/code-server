package cli

import (
	"time"

	"github.com/pterm/pterm"
)

func ColourTime(date time.Time) string {
	dateStr := date.Format("2006-01-02 15:04:05")

	if date.After(time.Now()) {
		dateStr = pterm.LightGreen(dateStr)
	} else {
		dateStr = pterm.LightRed(dateStr)
	}

	return dateStr
}
