export class SecurityManager {
  private static forbiddenKeywords = [
    "document.cookie",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "XMLHttpRequest",
    "WebSocket"
  ];

  public static validateSandboxScript(code: string, grantedPermissions: string[]): {
    authorized: boolean;
    reason?: string;
  } {
    // 1. Basic Static Analysis
    if (code.includes("eval(") || code.includes("Function(")) {
      return {
        authorized: false,
        reason: "Execution of dynamic code builders (eval, Function) is strictly prohibited inside the plugin sandbox."
      };
    }

    // 2. Keyword scans
    if (!grantedPermissions.includes("network_access")) {
      for (const keyword of this.forbiddenKeywords) {
        if (code.includes(keyword)) {
          return {
            authorized: false,
            reason: `Script requests restricted API access matching [${keyword}] without possessing required permission 'network_access'.`
          };
        }
      }
    }

    return { authorized: true };
  }
}
