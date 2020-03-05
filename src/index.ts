/* tslint:disable */
import request from 'request-promise-native'
import { Stream, Remote, SchemaDefinition } from './types'
import { getStreamSeaClient } from './stream-sea-client'
import { StreamSeaSubscription } from './stream-sea-subscription'
import { getHttpURLScheme } from './utils'

export const subscribe = async (args: Remote & Stream & {fanout?: boolean}) => {
  const client = getStreamSeaClient(args)
  const subscription = new StreamSeaSubscription(args.stream)
  client.addSubscription(subscription)
  return subscription
}

export const publish = async (args: Remote & Stream & { payload: any }) => {
  return await request({
    url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/publish`,
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
    },
    method: 'POST',
    gzip: true,
    json: true,
    body: { payload: args.payload },
  })
}

export const defineStream = async (args: Remote & Stream & SchemaDefinition) => {
  return await request({
    url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/define`,
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
    },
    method: 'POST',
    gzip: true,
    json: true,
    body: { version: args.version, fields: args.fields },
  })
}

export const describeStream = async (args: Remote & Stream & SchemaDefinition) => {
  const a = {
    url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/streams/${args.stream}/schema`,
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
    },
    method: 'GET',
    gzip: true,
    json: true,
  }
  return await request(a)
}

export const createClient = async (args: Remote & { description: string }) => {
  return await request({
    url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client`,
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
    },
    method: 'POST',
    gzip: true,
    json: true,
    body: { description: args.description },
  })
}

export const deleteClient = async (args: Remote & { clientId: string }) => {
  return await request({
    url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client/${args.clientId}`,
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
    },
    method: 'DELETE',
    gzip: true,
    json: true,
  })
}

export const rotateClientSecret = async (args: Remote & { clientId: string }) => {
  return await request({
    url: `${getHttpURLScheme(args.secure)}://${args.remoteServerHost}:${args.remoteServerPort}/api/v1/client/${args.clientId}`,
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString('base64'),
    },
    method: 'PUT',
    gzip: true,
    json: true,
  })
}
