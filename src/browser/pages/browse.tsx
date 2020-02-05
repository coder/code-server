import * as React from "react"
import { FilesResponse } from "../../common/api"
import { HttpError } from "../../common/http"
import { getFiles } from "../api"
import { RequestError } from "../components/error"

/**
 * File browser.
 */
export const Browse: React.FunctionComponent = (props) => {
  const [response, setResponse] = React.useState<FilesResponse>()
  const [error, setError] = React.useState<HttpError>()

  React.useEffect(() => {
    getFiles()
      .then(setResponse)
      .catch(setError)
  }, [props])

  return (
    <>
      {error || (response && response.files.length === 0) ? (
        <RequestError error={error || "Empty directory"} />
      ) : (
        <ul>
          {((response && response.files) || []).map((f, i) => (
            <li key={i}>{f.name}</li>
          ))}
        </ul>
      )}
    </>
  )
}
