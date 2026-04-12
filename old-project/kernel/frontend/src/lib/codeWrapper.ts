export interface ProblemParam {
  name: string;
  type: "int" | "int[]" | "string" | "boolean" | "ListNode";
}

export interface WrapperProblemMeta {
  methodName: string;
  params: ProblemParam[];
  returnType: "int" | "int[]" | "string" | "boolean" | "ListNode";
}

export function wrapCode(
  userCode: string,
  language: string,
  meta: WrapperProblemMeta,
): string {
  switch (language) {
    case "python":
      return wrapPython(userCode, meta);
    case "javascript":
    case "typescript":
      return wrapJavaScript(userCode, meta);
    case "java":
      return wrapJava(userCode, meta);
    default:
      return userCode;
  }
}

// ── Python wrapper ───────────────────────────────────────

function wrapPython(userCode: string, meta: WrapperProblemMeta): string {
  const { methodName, params, returnType } = meta;
  const hasListNode =
    params.some((p) => p.type === "ListNode") || returnType === "ListNode";

  const listNodeHelper = hasListNode
    ? `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _arrayToList(arr):
    dummy = ListNode(0)
    curr = dummy
    for v in arr:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def _listToArray(node):
    arr = []
    while node:
        arr.append(node.val)
        node = node.next
    return arr
`
    : "";

  // Build regex that splits on ", paramName =" boundaries
  const paramNames = params.map((p) => p.name);
  const splitPattern = paramNames.join("|");

  // Build arg parsing lines
  const parseLines = params
    .map((p, i) => {
      const varName = `_arg${i}`;
      let parseLine = `    ${varName} = json.loads(_parts[${i}])`;
      if (p.type === "ListNode") {
        parseLine += `\n    ${varName} = _arrayToList(${varName})`;
      }
      return parseLine;
    })
    .join("\n");

  const argList = params.map((_, i) => `_arg${i}`).join(", ");

  // Build output formatting
  let outputLine: string;
  if (returnType === "ListNode") {
    outputLine = `    print(json.dumps(_listToArray(_result), separators=(',',':')))`;
  } else if (returnType === "int[]") {
    outputLine = `    print(json.dumps(_result, separators=(',',':')))`;
  } else if (returnType === "boolean") {
    outputLine = `    print(str(_result).lower())`;
  } else {
    outputLine = `    print(_result)`;
  }

  return `import sys, json, re
${listNodeHelper}
${userCode}

if __name__ == "__main__":
    _input = sys.stdin.read().strip()
    _pattern = r',\\s*(?=(?:${splitPattern})\\s*=)'
    _assignments = re.split(_pattern, _input)
    _parts = []
    for _a in _assignments:
        _eq = _a.index('=')
        _parts.append(_a[_eq+1:].strip())
${parseLines}
    _sol = Solution()
    _result = _sol.${methodName}(${argList})
${outputLine}
`;
}

// ── JavaScript wrapper ───────────────────────────────────

function wrapJavaScript(userCode: string, meta: WrapperProblemMeta): string {
  const { methodName, params, returnType } = meta;
  const hasListNode =
    params.some((p) => p.type === "ListNode") || returnType === "ListNode";

  const listNodeHelper = hasListNode
    ? `
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}

function _arrayToList(arr) {
  let dummy = new ListNode(0);
  let curr = dummy;
  for (const v of arr) {
    curr.next = new ListNode(v);
    curr = curr.next;
  }
  return dummy.next;
}

function _listToArray(node) {
  const arr = [];
  while (node) {
    arr.push(node.val);
    node = node.next;
  }
  return arr;
}
`
    : "";

  const paramNames = params.map((p) => p.name);
  const splitPattern = paramNames.join("|");

  const parseLines = params
    .map((p, i) => {
      const varName = `_arg${i}`;
      let line = `  const ${varName}Raw = JSON.parse(_parts[${i}]);`;
      if (p.type === "ListNode") {
        line += `\n  const ${varName} = _arrayToList(${varName}Raw);`;
      } else {
        line += `\n  const ${varName} = ${varName}Raw;`;
      }
      return line;
    })
    .join("\n");

  const argList = params.map((_, i) => `_arg${i}`).join(", ");

  let outputLine: string;
  if (returnType === "ListNode") {
    outputLine = `  console.log(JSON.stringify(_listToArray(_result)));`;
  } else if (returnType === "int[]") {
    outputLine = `  console.log(JSON.stringify(_result));`;
  } else {
    outputLine = `  console.log(_result);`;
  }

  return `${listNodeHelper}
${userCode}

(function() {
  const _input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
  const _pattern = /,\\s*(?=(?:${splitPattern})\\s*=)/;
  const _assignments = _input.split(_pattern);
  const _parts = _assignments.map(function(a) {
    const eq = a.indexOf('=');
    return a.substring(eq + 1).trim();
  });
${parseLines}
  const _result = ${methodName}(${argList});
${outputLine}
})();
`;
}

// ── Java wrapper ─────────────────────────────────────────

function wrapJava(userCode: string, meta: WrapperProblemMeta): string {
  const { methodName, params, returnType } = meta;
  const hasListNode =
    params.some((p) => p.type === "ListNode") || returnType === "ListNode";

  const listNodeClass = hasListNode
    ? `
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
`
    : "";

  const listNodeHelpers = hasListNode
    ? `
    static ListNode arrayToList(int[] arr) {
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for (int v : arr) { curr.next = new ListNode(v); curr = curr.next; }
        return dummy.next;
    }
    static String listToString(ListNode node) {
        StringBuilder sb = new StringBuilder("[");
        while (node != null) {
            sb.append(node.val);
            if (node.next != null) sb.append(",");
            node = node.next;
        }
        sb.append("]");
        return sb.toString();
    }
`
    : "";

  // Strip "class Solution" wrapper to re-wrap it
  const paramNames = params.map((p) => p.name);
  const splitPattern = paramNames.join("|");

  // Build argument parsing
  const parseLines = params
    .map((p, i) => {
      const raw = `raw${i}`;
      switch (p.type) {
        case "int":
          return `            int arg${i} = Integer.parseInt(${raw});`;
        case "int[]":
          return `            ${raw} = ${raw}.replaceAll("[\\\\[\\\\]\\\\s]", "");
            String[] arr${i} = ${raw}.isEmpty() ? new String[0] : ${raw}.split(",");
            int[] arg${i} = new int[arr${i}.length];
            for (int j = 0; j < arr${i}.length; j++) arg${i}[j] = Integer.parseInt(arr${i}[j].trim());`;
        case "string":
          return `            String arg${i} = ${raw}.startsWith("\\"") ? ${raw}.substring(1, ${raw}.length()-1) : ${raw};`;
        case "boolean":
          return `            boolean arg${i} = Boolean.parseBoolean(${raw});`;
        case "ListNode":
          return `            ${raw} = ${raw}.replaceAll("[\\\\[\\\\]\\\\s]", "");
            String[] ln${i} = ${raw}.isEmpty() ? new String[0] : ${raw}.split(",");
            int[] lna${i} = new int[ln${i}.length];
            for (int j = 0; j < ln${i}.length; j++) lna${i}[j] = Integer.parseInt(ln${i}[j].trim());
            ListNode arg${i} = arrayToList(lna${i});`;
        default:
          return `            String arg${i} = ${raw};`;
      }
    })
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");

  // Return type for Java
  const javaReturnType = (() => {
    switch (returnType) {
      case "int":
        return "int";
      case "int[]":
        return "int[]";
      case "string":
        return "String";
      case "boolean":
        return "boolean";
      case "ListNode":
        return "ListNode";
      default:
        return "Object";
    }
  })();

  let outputLine: string;
  if (returnType === "int[]") {
    outputLine = `            System.out.println(java.util.Arrays.toString(result).replace(" ", ""));`;
  } else if (returnType === "boolean" || returnType === "int") {
    outputLine = `            System.out.println(result);`;
  } else if (returnType === "ListNode") {
    outputLine = `            System.out.println(listToString(result));`;
  } else {
    outputLine = `            System.out.println(result);`;
  }

  return `import java.util.*;
import java.io.*;

${listNodeClass}

${userCode}

public class Main {
${listNodeHelpers}
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        String input = sb.toString().trim();
        String[] assignments = input.split(",\\\\s*(?=(?:${splitPattern})\\\\s*=)");
        String[] parts = new String[assignments.length];
        for (int i = 0; i < assignments.length; i++) {
            int eq = assignments[i].indexOf('=');
            parts[i] = assignments[i].substring(eq + 1).trim();
        }
${params.map((_, i) => `        String raw${i} = parts[${i}];`).join("\n")}
${parseLines}
        Solution sol = new Solution();
            ${javaReturnType} result = sol.${methodName}(${argList});
${outputLine}
    }
}
`;
}
