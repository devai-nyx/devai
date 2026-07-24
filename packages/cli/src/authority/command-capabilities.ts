import { AsyncLocalStorage } from 'node:async_hooks';

const sessionOperations = new AsyncLocalStorage<() => unknown>();
const policyMaterializations = new AsyncLocalStorage<() => unknown>();
const skillRecordings = new AsyncLocalStorage<
  (skillId: string, callback: () => unknown) => unknown
>();

export function runWithAuthoritySessionOperation<T>(
  operation: (() => unknown) | undefined,
  callback: () => T,
): T {
  return operation === undefined ? callback() : sessionOperations.run(operation, callback);
}

export function executeAuthoritySessionOperation(): unknown {
  const operation = sessionOperations.getStore();
  if (!operation) throw new Error('AUTHORITY_SESSION_OPERATION_REQUIRED');
  return operation();
}

export function runWithAuthorityPolicyMaterialization<T>(
  operation: (() => unknown) | undefined,
  callback: () => T,
): T {
  return operation === undefined ? callback() : policyMaterializations.run(operation, callback);
}

export function executeAuthorityPolicyMaterialization(): unknown {
  const operation = policyMaterializations.getStore();
  if (!operation) throw new Error('AUTHORITY_POLICY_MATERIALIZATION_REQUIRED');
  return operation();
}

export function runWithAuthoritySkillRecording<T>(
  operation: ((skillId: string, callback: () => unknown) => unknown) | undefined,
  callback: () => T,
): T {
  return operation === undefined ? callback() : skillRecordings.run(operation, callback);
}

export function executeAuthoritySkillRecording<T>(skillId: string, callback: () => T): T {
  const operation = skillRecordings.getStore();
  if (!operation) throw new Error('AUTHORITY_SKILL_RECORDING_REQUIRED');
  return operation(skillId, callback) as T;
}
