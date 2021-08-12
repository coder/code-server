declare namespace NodeJS {
  interface Global {
    ports: Array<string>
    portMappings: { [key: string]: string }
  }
}
