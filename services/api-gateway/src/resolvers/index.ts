import { authResolvers } from './auth.js';
import { userResolvers } from './users.js';
import { projectResolvers } from './projects.js';
import { dashboardResolvers } from './dashboard.js';
import { organizationResolvers } from './organizations.js';
import { campusResolvers } from './campuses.js';
import { GraphQLScalarType, Kind } from 'graphql';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: new GraphQLScalarType({ name: 'JSON', serialize: (v) => v, parseValue: (v) => v, parseLiteral: (ast) => ast }),
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...projectResolvers.Query,
    ...dashboardResolvers.Query,
    ...organizationResolvers.Query,
    ...campusResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...organizationResolvers.Mutation,
    ...campusResolvers.Mutation,
  },
};
