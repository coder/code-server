package templates

import (
	"github.com/chasefleming/elem-go"
	"github.com/chasefleming/elem-go/attrs"
	"github.com/chasefleming/elem-go/styles"
)

var bodyStyle = styles.Props{
	styles.Margin:     "40px auto",
	styles.MaxWidth:   "800px",
	styles.LineHeight: "1.5",
	styles.FontSize:   "16px",
	styles.Color:      "#444",
	styles.Padding:    "0 10px",
	styles.FontFamily: "Sans-serif",
}

var headerStyle = styles.Props{
	styles.LineHeight: "1.2",
}

func headerOne(text string) *elem.Element {
	return elem.H1(attrs.Props{attrs.Style: headerStyle.ToInline()}, elem.Text(text))
}

func headerTwo(text string) *elem.Element {
	return elem.H2(attrs.Props{attrs.Style: headerStyle.ToInline()}, elem.Text(text))
}

func headerThree(text string) *elem.Element {
	return elem.H3(attrs.Props{attrs.Style: headerStyle.ToInline()}, elem.Text(text))
}

func HtmlStructure(head, body *elem.Element) *elem.Element {
	return elem.Html(nil,
		elem.Head(
			attrs.Props{
				attrs.Lang: "en",
			},
			elem.Meta(attrs.Props{
				attrs.Charset: "UTF-8",
			}),
			elem.Meta(attrs.Props{
				attrs.HTTPequiv: "X-UA-Compatible",
				attrs.Content:   "IE=edge",
			}),
			elem.Meta(attrs.Props{
				attrs.Name:    "viewport",
				attrs.Content: "width=device-width, initial-scale=1.0",
			}),
			head,
		),
		body,
	)
}
