import { Upload as BaseUpload, IURI } from "@coder/ide";
import { client } from "./entry";
import { INotificationService, Severity } from "vs/platform/notification/common/notification";
import { IProgressService2, ProgressLocation } from "vs/workbench/services/progress/common/progress";

export class Upload extends BaseUpload {

	public constructor(
		@INotificationService notificationService: INotificationService,
		@IProgressService2 progressService: IProgressService2,
	) {
		super({
			error: (error) => {
				notificationService.error(error);
			},
			prompt: (message, choices) => {
				return new Promise((resolve) => {
					notificationService.prompt(
						Severity.Error,
						message,
						choices.map((label) => ({
							label,
							run: () => {
								resolve(label);
							},
						})),
						() => {
							resolve(undefined);
						},
					);
				});
			},
		}, {
			start: (title, task) => {
				let lastProgress = 0;

				return progressService.withProgress({
					location: ProgressLocation.Notification,
					title,
					cancellable: true,
				}, (progress) => {
					return task({
						report: (p) => {
							progress.report({ increment: p - lastProgress });
							lastProgress = p;
						},
					});
				}, () => {
					this.cancel();
				});
			},
		});
	}

	public async uploadDropped(event: DragEvent, uri?: IURI): Promise<string[]> {
		return super.uploadDropped(event, uri || (await client.workspace).mountUri);
	}

}
