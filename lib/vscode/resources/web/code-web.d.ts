/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * @file this is a temporary type definition.
 * Upstream seems to be modifying the web module often and will likely switch to TypeScript.
 */

import * as http from 'http';
import { IServerWorkbenchConstructionOptions } from 'vs/workbench/workbench.web.api';

export function requestHandler(req: http.IncomingMessage, res: http.ServerResponse, webConfigJSON: IServerWorkbenchConstructionOptions): void;
