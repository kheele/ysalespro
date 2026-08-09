import { convertMutations } from './funs';

// Define types for arguments
interface Auth {
    token?: string;
    user_auth_id?: string;
    user_access_type?: string;
}

interface RelayArgs {
    headers?: Record<string, string>;
    query?: string;
    variables?: any;
    operationName?: string;
    auth?: Auth;
    mutation?: string; // for updateRelay
    id?: any; // for updateRelay
    attrs?: any; // for updateRelay
    input?: any; // for insertRelay
    multi_queries?: boolean; // for getRelayOne
}

//<editor-fold desc="sendRelay">
const sendRelay = async (args: RelayArgs | null) => {
    if (!args) return null;

    let { headers, query, variables, operationName, auth } = args;

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

    console.log('hasura relay headers:', headers);

    try {
        const result = await fetch(process.env.ENDPOINT_HASURA_RELAY as string, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-access-key": process.env.HASURA_ADMIN_SECRET as string,
                "X-Hasura-Role": "admin",
                ...headers,
            },
            body: JSON.stringify({
                query,
                variables,
                operationName
            })
        });

        // console.log('result', result)

        try {
            const { errors, data } = await result.json();
            if (errors) {
                // handle those errors like a pro
                console.error(errors, query);
                return null;
            }

            // console.log('sendRelay res', data);

            return data;
        } catch (err) {
            console.log('result err', err)
            throw err;
        }
    } catch (err) {
        console.log('result err', err)
        throw err;
    }
};
export { sendRelay };
//</editor-fold>

//<editor-fold desc="listRelay">
export const listRelay = async ({ query, operationName, variables }: RelayArgs) => {
    const query_res = await sendRelay({
        query,
        operationName,
        variables,
    });
    if (!query_res) {
        return;
    }

    const key = Object.keys(query_res)[0];
    const connection = query_res[key];
    // console.log('connection', connection)
    const { edges = [] } = connection;
    const nodes = edges.map(({ cursor, node }: any) => {
        node = convertMutations(node);
        if (node.id) {
            return { data: node, cursor };
        } else {
            return node;
        }
    });
    // console.log("onCompleted nodes", nodes);
    return nodes;
};
//</editor-fold>

//<editor-fold desc="getRelayOne">
export const getRelayOne = async ({ query, operationName, variables, multi_queries = false }: RelayArgs) => {
    const query_res = await sendRelay({
        query,
        operationName,
        variables,
    });
    // console.log('query_res1', query_res)
    if (!query_res) {
        return;
    }

    if (multi_queries) {
        Object.keys(query_res).forEach(key => {
            const connection = query_res[key];
            const { edges = [] } = connection;
            const nodes = edges.map(({ cursor, node }: any) => {
                node = convertMutations(node);
                if (node.id) {
                    return { data: node, cursor };
                } else {
                    return node;
                }
            });

            query_res[key] = nodes;
        });
        // console.log(query_res)
        return query_res;
    } else {
        const key = Object.keys(query_res)[0];
        const connection = query_res[key];
        const { edges = [] } = connection;
        let [edge] = edges;
        let { node = null } = edge || {};
        return convertMutations(node);
    }
};
//</editor-fold>

//<editor-fold desc="insertRelay">
export const insertRelay = async ({ query, operationName, input, auth }: RelayArgs) => {
    return await sendRelay({
        query,
        operationName,
        variables: { object: input },
        auth,
    });
};
//</editor-fold>

//<editor-fold desc="updateRelay">
export const updateRelay = async (args: RelayArgs) => {
    const { mutation, operationName, id, attrs, auth } = args;
    if (attrs.id) {
        delete attrs.id;
    }
    return await sendRelay({
        query: mutation,
        operationName,
        variables: {
            id: id,
            _set: attrs,
        },
        auth,
    });
};
//</editor-fold>
