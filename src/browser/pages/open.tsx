import * as React from "react"
import { Application } from "../../common/api"
import { getApplications } from "../api"
import { ApplicationSection, AppLoader } from "../components/list"

export interface OpenProps {
  app?: Application
  setApp(app: Application): void
}

/**
 * Display recently used applications.
 */
export const Open: React.FunctionComponent<OpenProps> = (props) => {
  return (
    <AppLoader
      getApps={async (): Promise<ReadonlyArray<ApplicationSection>> => {
        const response = await getApplications()
        return [
          {
            header: "Applications",
            apps: response && response.applications,
          },
        ]
      }}
      {...props}
    />
  )
}
