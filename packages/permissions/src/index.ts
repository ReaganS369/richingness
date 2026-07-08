export type PermissionType = 'read' | 'write' | 'admin';

export interface IPermissionManager {
  /**
   * Evaluates if the current user has access to a specific scope resource.
   */
  hasPermission(userId: string, scope: string, action: PermissionType): Promise<boolean>;
}
