import { Dates } from './lib/date-utils';

const isNullable = function ($this: any): boolean {
    return $this === null || $this === undefined;
};

const isNumber = function ($this: any): $this is number {
    return $this instanceof Number || typeof $this === 'number';
};

const isString = function ($this: any): $this is string {
    return $this instanceof String || typeof $this === 'string';
};

const isDate = function ($this: any): $this is Date {
    if (!$this)
        return false;

    if (isNumber($this)) {
        if (String($this).length !== 13) {
            return false;
        }
        $this = new Date($this);
    }

    if (isString($this)) {
        // // Attempt to parse the date. Date.parse returns a timestamp or NaN.
        // const timestamp = Dates.parse($this);

        // // Check if the result is a number and not NaN.
        // if (isNaN(timestamp)) {
        //     return false;
        // }

        // // A more robust check: create a new Date object from the parsed timestamp.
        // $this = new Date(timestamp);
        $this = Dates.parse($this);
    }

    if (!$this)
        return false;

    return $this instanceof Date;
};

// @ts-ignore
global.isDate = isDate;

const convertIdToBigint = (encodedHasuraRelayID: any) => {
    try {
        if (isNumber(encodedHasuraRelayID)) return encodedHasuraRelayID;

        const decodedRelayID = atob(encodedHasuraRelayID);
        const relayIdAsArray = JSON.parse(decodedRelayID);
        const actualDatabaseID = relayIdAsArray[3];
        // console.log(decodedRelayID); // "[1, \"lifeplan\", \"status_plan_header\", 1]"
        // console.log(relayIdAsArray); // [1, "lifeplan", "status_plan_header", 1]
        // console.log(actualDatabaseID); // 1  (the actual database ID)!
        return actualDatabaseID;
    } catch (err) {
        // console.error('convertIdToBigint', encodedHasuraRelayID, err);
        return encodedHasuraRelayID;
    }
};

const convertMutationsImpl = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(convertMutationsImpl);
    } else if (typeof obj === 'object' && !isNullable(obj)) {
        let newObj: any = {};
        const keys = Object.keys(obj);
        for (let n = 0; n < keys.length; n++) {
            const key = keys[n];
            let value = obj[key];
            if (isDate(value)) {
                value = Dates.parse(value);
            } else if (Array.isArray(value)) {
                value = value.map(convertMutationsImpl);
            } else if (typeof value === 'object' && !isNullable(value)) {
                value = convertMutationsImpl(value);
            } else {
                if (key === 'id' || (key.endsWith('_id') && key !== 'auth_id')) {
                    value = convertIdToBigint(value);
                }
                else if (key.endsWith('_list') && isNullable(value)) {
                    value = [];
                }
            }
            if (key !== "__typename") {
                newObj[key] = value;
            }
        }
        return newObj;
    }
    return obj;
};
export const convertMutations = convertMutationsImpl;
