export interface Remote {
  clientId: string
  remoteServerHost: string
  remoteServerPort: string
  secure: boolean
}

export interface Stream {
  stream: string
}

export enum FieldType {
  STRING = 'string',
  FLOAT = 'float',
  INTEGER = 'integer',
  DATE = 'date',
  STRING_ARRAY = 'array<string>',
  FLOAT_ARRAY = 'array<float>',
  INTEGER_ARRAY = 'array<integer>',
  DATE_ARRAY = 'array<date>',
  ENUM = 'enum',
  OBJECT = 'object',
  OBJECT_ARRAY = 'array<object>',
}

export type SchemaField =
  | {
      name: string
      type: FieldType.STRING | FieldType.FLOAT | FieldType.INTEGER | FieldType.DATE | FieldType.STRING_ARRAY | FieldType.FLOAT_ARRAY | FieldType.INTEGER_ARRAY | FieldType.DATE_ARRAY
    }
  | {
      name: string
      type: FieldType.ENUM
      enum: string[]
    }
  | ({
      name: string
      type: FieldType.OBJECT | FieldType.OBJECT_ARRAY
    } & Schema)

export interface Schema {
  fields: SchemaField[]
}

export interface SchemaDefinition extends Schema {
  name: string
  version: number
}

export type BasicCredentialOptions = {type: 'basic', clientId: string, clientSecret: string}
export type JwtCredentialOptions = {type: 'jwt', clientId: string, jwt: string}
export type CredentialOptions = BasicCredentialOptions | JwtCredentialOptions