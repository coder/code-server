package templates

import (
	"fmt"

	"github.com/chasefleming/elem-go"
	"github.com/chasefleming/elem-go/attrs"
	"github.com/chasefleming/elem-go/styles"
	"github.com/juanfont/headscale/hscontrol/types"
)

var codeStyleRegisterWebAPI = styles.Props{
	styles.Display:         "block",
	styles.Padding:         "20px",
	styles.Border:          "1px solid #bbb",
	styles.BackgroundColor: "#eee",
}

func RegisterWeb(registrationID types.RegistrationID) *elem.Element {
	return HtmlStructure(
		elem.Title(nil, elem.Text("Registration - Headscale")),
		elem.Body(attrs.Props{
			attrs.Style: styles.Props{
				styles.FontFamily: "sans",
			}.ToInline(),
		},
			elem.H1(nil, elem.Text("headscale")),
			elem.H2(nil, elem.Text("Machine registration")),
			elem.P(nil, elem.Text("Run the command below in the headscale server to add this machine to your network: ")),
			elem.Code(attrs.Props{attrs.Style: codeStyleRegisterWebAPI.ToInline()},
				elem.Text(fmt.Sprintf("headscale nodes register --key %s --user USERNAME", registrationID.String())),
			),
		),
	)
}
