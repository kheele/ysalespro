'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL } from '@/graphql';
import type { AccountCompany } from '@/lib/types';

const ACCOUNT_COMPANY_FIELDS = `
  id
  name
  domain
  logo_url
  subscription_tier
  created_at
  updated_at
`;

function mapDbAccountCompany(c: any): AccountCompany | null {
  if (!c) return null;
  return {
    id: Number(c.id),
    name: c.name || "Account Company",
    domain: c.domain || "",
    logo_url: c.logo_url || "",
    subscription_tier: c.subscription_tier || "Pro",
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

export async function getAccountCompanies(params?: { search?: string }): Promise<AccountCompany[]> {
  try {
    const whereConditions: Record<string, any>[] = [];

    if (params?.search) {
      const s = `%${params.search}%`;
      whereConditions.push({
        _or: [
          { name: { _ilike: s } },
          { domain: { _ilike: s } },
        ],
      });
    }

    const where = whereConditions.length > 0 ? { _and: whereConditions } : {};

    const query = `
      query GetAccountCompanies($where: aa_s_account_companies_bool_exp) {
        aa_s_account_companies(where: $where, order_by: [{ created_at: desc }]) {
          ${ACCOUNT_COMPANY_FIELDS}
        }
      }
    `;

    const res = await listGraphQL({
      query,
      operationName: "GetAccountCompanies",
      variables: { where },
    });

    const list = Array.isArray(res) ? res : [];
    return list.map(mapDbAccountCompany).filter(Boolean) as AccountCompany[];
  } catch (err) {
    console.error("getAccountCompanies error:", err);
    return [];
  }
}

export async function getAccountCompanyById(id: number | string): Promise<AccountCompany | null> {
  try {
    const query = `
      query GetAccountCompanyById($id: Int!) {
        aa_s_account_companies_by_pk(id: $id) {
          ${ACCOUNT_COMPANY_FIELDS}
        }
      }
    `;

    const res = await getGraphQLOne({
      query,
      operationName: "GetAccountCompanyById",
      variables: { id: Number(id) },
    });

    return mapDbAccountCompany(res);
  } catch (err) {
    console.error("getAccountCompanyById error:", err);
    return null;
  }
}

export async function createAccountCompany(input: {
  name: string;
  domain?: string;
  logo_url?: string;
  subscription_tier?: string;
}): Promise<AccountCompany | null> {
  try {
    const mutation = `
      mutation CreateAccountCompany($object: aa_s_account_companies_insert_input!) {
        insert_aa_s_account_companies_one(object: $object) {
          ${ACCOUNT_COMPANY_FIELDS}
        }
      }
    `;

    const object = {
      name: input.name,
      domain: input.domain || "",
      logo_url: input.logo_url || "",
      subscription_tier: input.subscription_tier || "Pro",
    };

    const res = await insertGraphQL({
      mutation,
      operationName: "CreateAccountCompany",
      input: object,
    });

    return mapDbAccountCompany(res);
  } catch (err) {
    console.error("createAccountCompany error:", err);
    return null;
  }
}

export async function updateAccountCompany(
  id: number | string,
  attrs: {
    name?: string;
    domain?: string;
    logo_url?: string;
    subscription_tier?: string;
  }
): Promise<AccountCompany | null> {
  try {
    const mutation = `
      mutation UpdateAccountCompany($id: Int!, $_set: aa_s_account_companies_set_input!) {
        update_aa_s_account_companies_by_pk(pk_columns: { id: $id }, _set: $_set) {
          ${ACCOUNT_COMPANY_FIELDS}
        }
      }
    `;

    const _set: Record<string, any> = {};
    if (attrs.name) _set.name = attrs.name;
    if (attrs.domain !== undefined) _set.domain = attrs.domain;
    if (attrs.logo_url !== undefined) _set.logo_url = attrs.logo_url;
    if (attrs.subscription_tier !== undefined) _set.subscription_tier = attrs.subscription_tier;

    const res = await updateGraphQL({
      mutation,
      operationName: "UpdateAccountCompany",
      id: Number(id),
      attrs: _set,
    });

    return mapDbAccountCompany(res);
  } catch (err) {
    console.error("updateAccountCompany error:", err);
    return null;
  }
}

export async function deleteAccountCompany(id: number | string): Promise<boolean> {
  try {
    const mutation = `
      mutation DeleteAccountCompany($id: Int!) {
        delete_aa_s_account_companies_by_pk(id: $id) {
          id
        }
      }
    `;

    const res = await deleteGraphQL({
      mutation,
      operationName: "DeleteAccountCompany",
      id: Number(id),
    });

    return !!res;
  } catch (err) {
    console.error("deleteAccountCompany error:", err);
    return false;
  }
}
