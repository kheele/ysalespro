
import {
    GraphQLListArg,
    GraphQLOneArg,
    GraphQLInsertArg,
    GraphQLUpdateArg,
    GraphQLDeleteArg,
} from "./lib/graphql_types";
import { convertMutations } from './funs';

//<editor-fold desc="sendGraphQL">
export const sendGraphQL = async (args: Record<string, any>) => {
    if (!args) return null;
    let { headers, mutation, query, variables, operationName, multi_queries, count, token, auth } = args;

    if (!headers) {
        headers = {};
    }

    if (auth) {
        const { token, user_auth_id, user_access_type } = auth;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (user_auth_id) {
            headers['X-Hasura-User-Id'] = user_auth_id;
        }
        if (user_access_type) {
            headers['X-Hasura-User-Access-Type'] = user_access_type;
        }
    }

    // console.log('hasura headers:', headers);

    if (mutation) {
        return fetch(process.env.ENDPOINT_HASURA_GRAPHQL!, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-access-key": process.env.HASURA_ADMIN_SECRET!,
                "X-Hasura-Role": "admin",
                ...headers,
            },
            body: JSON.stringify({ query: mutation, operationName, variables }),
        }).then(res => {
            try {
                return res.json();
            } catch (err) {
                console.error(err);
                res.text().then(text => console.error(text));
                throw err;
            }
        }).then(res => {
            const { errors, data } = res;

            if (errors) {
                console.log('errors', mutation, JSON.stringify(errors));
                throw new Error(JSON.stringify(errors));
            }

            const key = Object.keys(data)[0];
            return convertMutations(data[key]);
        }).catch(err => {
            throw err;
        });
    }

    return fetch(process.env.ENDPOINT_HASURA_GRAPHQL!, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-hasura-access-key": process.env.HASURA_ADMIN_SECRET!,
            "X-Hasura-Role": "admin",
            ...headers,
        },
        body: JSON.stringify({ query, variables }),
    }).then(res => {
        try {
            return res.json();
        } catch (err) {
            console.error(err);
            res.text().then(text => console.error(text));
            throw err;
        }
    }).then(res => {
        const { errors, data } = res;

        if (errors) {
            console.log('errors', query);
            throw new Error(JSON.stringify(errors));
        }

        if (multi_queries) {
            if (!count) {
                Object.keys(data).forEach(key => {
                    const list = data[key];
                    if (Array.isArray(list)) {
                        list.forEach(node => {
                            convertMutations(node);
                        });
                    } else {
                        convertMutations(list);
                    }
                });
                return data;
            }
            const key = Object.keys(data)[0];
            const list = data[key];
            return list[0];
        } else {
            const key = Object.keys(data)[0];
            const list = data[key];
            if (Array.isArray(list)) {
                const nodes = list.map(node => {
                    return convertMutations(node);
                });
                return nodes;
            } else {
                return convertMutations(list);
            }
        }
    }).catch(err => {
        throw err;
    });
};
//</editor-fold>

//<editor-fold desc="listGraphQL">
export const listGraphQL = async (args: GraphQLListArg) => {
    return await sendGraphQL(args);
};
//</editor-fold>

//<editor-fold desc="getGraphQLOne">
export const getGraphQLOne = async (args: GraphQLOneArg) => {
    return await sendGraphQL(args).then(res => {
        if (res) {
            return Array.isArray(res) ? res[0] : res;
        }
    });
};
//</editor-fold>

//<editor-fold desc="insertGraphQL">
export const insertGraphQL = async (args: GraphQLInsertArg) => {
    let variables;
    if (args.variables) {
        variables = {
            ...args.variables,
            [Array.isArray(args.input) ? "objects" : "object"]: args.input
        };
    } else {
        variables = { [Array.isArray(args.input) ? "objects" : "object"]: args.input };
    }

    return await sendGraphQL({
        ...args,
        variables,
    });
};
//</editor-fold>

//<editor-fold desc="updateGraphQL">
export const updateGraphQL = async (args: GraphQLUpdateArg) => {
    const { mutation, operationName, id, attrs, auth } = args;
    if (attrs?.id) {
        delete attrs.id;
    }
    return await sendGraphQL({
        mutation,
        operationName,
        variables: {
            id,
            _set: attrs || {},
        },
        auth,
    });
};
//</editor-fold>

//<editor-fold desc="deleteGraphQL">
export const deleteGraphQL = async (args: GraphQLDeleteArg) => {
    const { mutation, operationName, id, auth, variables } = args;
    return await sendGraphQL({
        mutation,
        operationName,
        variables: variables || { id },
        auth,
    });
};
//</editor-fold>
