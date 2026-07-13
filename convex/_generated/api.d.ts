/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _shared_allowlist from "../_shared/allowlist.js";
import type * as _shared_auth from "../_shared/auth.js";
import type * as _shared_authGate from "../_shared/authGate.js";
import type * as _shared_db from "../_shared/db.js";
import type * as _shared_writeLimit from "../_shared/writeLimit.js";
import type * as auth from "../auth.js";
import type * as authRateLimit from "../authRateLimit.js";
import type * as authSeed from "../authSeed.js";
import type * as features_activity_mutations from "../features/activity/mutations.js";
import type * as features_activity_queries from "../features/activity/queries.js";
import type * as features_aiChat__schema from "../features/aiChat/_schema.js";
import type * as features_aiChat_action from "../features/aiChat/action.js";
import type * as features_aiChat_guard from "../features/aiChat/guard.js";
import type * as features_appSettings_mutations from "../features/appSettings/mutations.js";
import type * as features_appSettings_queries from "../features/appSettings/queries.js";
import type * as features_contacts_mutations from "../features/contacts/mutations.js";
import type * as features_contacts_queries from "../features/contacts/queries.js";
import type * as features_dataManagement__tables from "../features/dataManagement/_tables.js";
import type * as features_dataManagement_mutations from "../features/dataManagement/mutations.js";
import type * as features_dataManagement_queries from "../features/dataManagement/queries.js";
import type * as features_family_mutations from "../features/family/mutations.js";
import type * as features_family_queries from "../features/family/queries.js";
import type * as features_family_seed from "../features/family/seed.js";
import type * as features_filantropi_mutations from "../features/filantropi/mutations.js";
import type * as features_filantropi_queries from "../features/filantropi/queries.js";
import type * as features_filantropi_seed from "../features/filantropi/seed.js";
import type * as features_holdings_mutations from "../features/holdings/mutations.js";
import type * as features_holdings_queries from "../features/holdings/queries.js";
import type * as features_kesehatan_mutations from "../features/kesehatan/mutations.js";
import type * as features_kesehatan_queries from "../features/kesehatan/queries.js";
import type * as features_kesehatan_seed from "../features/kesehatan/seed.js";
import type * as features_lifestyle_mutations from "../features/lifestyle/mutations.js";
import type * as features_lifestyle_queries from "../features/lifestyle/queries.js";
import type * as features_lifestyle_seed from "../features/lifestyle/seed.js";
import type * as features_notiondb_mutations from "../features/notiondb/mutations.js";
import type * as features_notiondb_queries from "../features/notiondb/queries.js";
import type * as features_notiondb_registry from "../features/notiondb/registry.js";
import type * as features_office_mutations from "../features/office/mutations.js";
import type * as features_office_queries from "../features/office/queries.js";
import type * as features_onboarding_queries from "../features/onboarding/queries.js";
import type * as features_pageviews_mutations from "../features/pageviews/mutations.js";
import type * as features_pageviews_queries from "../features/pageviews/queries.js";
import type * as features_property_mutations from "../features/property/mutations.js";
import type * as features_property_queries from "../features/property/queries.js";
import type * as features_rbac_insights from "../features/rbac/insights.js";
import type * as features_rbac_mutations from "../features/rbac/mutations.js";
import type * as features_rbac_queries from "../features/rbac/queries.js";
import type * as features_security_mutations from "../features/security/mutations.js";
import type * as features_security_queries from "../features/security/queries.js";
import type * as features_security_seed from "../features/security/seed.js";
import type * as features_subsidiaries_mutations from "../features/subsidiaries/mutations.js";
import type * as features_subsidiaries_queries from "../features/subsidiaries/queries.js";
import type * as http from "../http.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_shared/allowlist": typeof _shared_allowlist;
  "_shared/auth": typeof _shared_auth;
  "_shared/authGate": typeof _shared_authGate;
  "_shared/db": typeof _shared_db;
  "_shared/writeLimit": typeof _shared_writeLimit;
  auth: typeof auth;
  authRateLimit: typeof authRateLimit;
  authSeed: typeof authSeed;
  "features/activity/mutations": typeof features_activity_mutations;
  "features/activity/queries": typeof features_activity_queries;
  "features/aiChat/_schema": typeof features_aiChat__schema;
  "features/aiChat/action": typeof features_aiChat_action;
  "features/aiChat/guard": typeof features_aiChat_guard;
  "features/appSettings/mutations": typeof features_appSettings_mutations;
  "features/appSettings/queries": typeof features_appSettings_queries;
  "features/contacts/mutations": typeof features_contacts_mutations;
  "features/contacts/queries": typeof features_contacts_queries;
  "features/dataManagement/_tables": typeof features_dataManagement__tables;
  "features/dataManagement/mutations": typeof features_dataManagement_mutations;
  "features/dataManagement/queries": typeof features_dataManagement_queries;
  "features/family/mutations": typeof features_family_mutations;
  "features/family/queries": typeof features_family_queries;
  "features/family/seed": typeof features_family_seed;
  "features/filantropi/mutations": typeof features_filantropi_mutations;
  "features/filantropi/queries": typeof features_filantropi_queries;
  "features/filantropi/seed": typeof features_filantropi_seed;
  "features/holdings/mutations": typeof features_holdings_mutations;
  "features/holdings/queries": typeof features_holdings_queries;
  "features/kesehatan/mutations": typeof features_kesehatan_mutations;
  "features/kesehatan/queries": typeof features_kesehatan_queries;
  "features/kesehatan/seed": typeof features_kesehatan_seed;
  "features/lifestyle/mutations": typeof features_lifestyle_mutations;
  "features/lifestyle/queries": typeof features_lifestyle_queries;
  "features/lifestyle/seed": typeof features_lifestyle_seed;
  "features/notiondb/mutations": typeof features_notiondb_mutations;
  "features/notiondb/queries": typeof features_notiondb_queries;
  "features/notiondb/registry": typeof features_notiondb_registry;
  "features/office/mutations": typeof features_office_mutations;
  "features/office/queries": typeof features_office_queries;
  "features/onboarding/queries": typeof features_onboarding_queries;
  "features/pageviews/mutations": typeof features_pageviews_mutations;
  "features/pageviews/queries": typeof features_pageviews_queries;
  "features/property/mutations": typeof features_property_mutations;
  "features/property/queries": typeof features_property_queries;
  "features/rbac/insights": typeof features_rbac_insights;
  "features/rbac/mutations": typeof features_rbac_mutations;
  "features/rbac/queries": typeof features_rbac_queries;
  "features/security/mutations": typeof features_security_mutations;
  "features/security/queries": typeof features_security_queries;
  "features/security/seed": typeof features_security_seed;
  "features/subsidiaries/mutations": typeof features_subsidiaries_mutations;
  "features/subsidiaries/queries": typeof features_subsidiaries_queries;
  http: typeof http;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
