package templates

import (
	"github.com/chasefleming/elem-go"
	"github.com/chasefleming/elem-go/attrs"
)

func Windows(url string) *elem.Element {
	return HtmlStructure(
		elem.Title(nil,
			elem.Text("headscale - Windows"),
		),
		elem.Body(attrs.Props{
			attrs.Style: bodyStyle.ToInline(),
		},
			headerOne("headscale: Windows configuration"),
			elem.P(nil,
				elem.Text("Download "),
				elem.A(attrs.Props{
					attrs.Href:   "https://tailscale.com/download/windows",
					attrs.Rel:    "noreferrer noopener",
					attrs.Target: "_blank",
				},
					elem.Text("Tailscale for Windows ")),
				elem.Text("and install it."),
			),
			elem.P(nil,
				elem.Text("Open a Command Prompt or Powershell and use Tailscale's login command to connect with headscale: "),
			),
			elem.Pre(nil,
				elem.Code(nil,
					elem.Text("tailscale login --login-server "+url),
				),
			),
		),
	)
}
