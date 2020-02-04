import * as React from "react"
import { Application } from "../../common/api"
import { getRecent } from "../api"
import { ApplicationSection, AppLoader } from "../components/list"

export interface RecentProps {
  app?: Application
  setApp(app: Application): void
}

/**
 * Display recently used applications.
 */
export const Recent: React.FunctionComponent<RecentProps> = (props) => {
  return (
    <AppLoader
      getApps={async (): Promise<ReadonlyArray<ApplicationSection>> => {
        const response = await getRecent()
        return [
          {
            header: "Running Applications",
            apps: response && response.running,
          },
          {
            header: "Recent Applications",
            apps: response && response.recent,
          },
        ]
      }}
      {...props}
    />
  )
}
