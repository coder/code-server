import * as React from "react"
import { HttpError } from "../../common/http"

export interface ErrorProps {
  error: HttpError | Error | string
  onClose?: () => void
}

/**
 * An error to be displayed in a section where a request has failed.
 */
export const RequestError: React.FunctionComponent<ErrorProps> = (props) => {
  return (
    <div className="request-error">
      <div className="error">{typeof props.error === "string" ? props.error : props.error.message}</div>
      {props.onClose ? (
        <button className="close" onClick={props.onClose}>
          Go Back
        </button>
      ) : (
        undefined
      )}
    </div>
  )
}

/**
 * Return a more human/natural/useful message for some error codes resulting
 * from a form submission.
 */
const humanizeFormError = (error: HttpError | Error | string): string => {
  if (typeof error === "string") {
    return error
  }
  switch ((error as HttpError).code) {
    case 401:
      return "Wrong password"
    default:
      return error.message
  }
}

/**
 * An error to be displayed underneath a field.
 */
export const FieldError: React.FunctionComponent<ErrorProps> = (props) => {
  return <div className="field-error">{humanizeFormError(props.error)}</div>
}
