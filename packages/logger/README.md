# Logger

Beautiful client logging inspired by https://github.com/uber-go/zap.

## Example Usage

```javascript
import { field, logger } from "@coder/logger";

logger.info("Loading container",
	field("container_id", container.id_str),
	field("organization_id", organization.id_str));
```

## Formatting

By default the logger uses a different formatter depending on whether it detects
it is running in the browser or not. A custom formatter can be set:

```javascript
import { logger, Formatter } from "@coder/logger";

class MyFormatter extends Formatter {
	// implementation ...
}

logger.formatter = new MyFormatter();
```
