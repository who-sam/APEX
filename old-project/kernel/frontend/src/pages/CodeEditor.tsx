import { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  BookmarkPlus,
  Share2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { executeCode } from "@/lib/api";
import { wrapCode, type ProblemParam } from "@/lib/codeWrapper";

const PROBLEMS = [
  {
    id: 1, title: "Two Sum", difficulty: "Easy",
    methodName: "twoSum",
    params: [{name:"nums", type:"int[]"}, {name:"target", type:"int"}] as ProblemParam[],
    returnType: "int[]" as const,
    tags: ["Array", "Hash Table"], likes: 12453, dislikes: 342,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "" },
      { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "" },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹", "Only one valid answer exists."],
    defaultCode: {
      javascript: `function twoSum(nums, target) {\n    // Write your solution here\n    \n};`,
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n    // Write your solution here\n    \n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        \n    }\n}`,
    },
  },
  {
    id: 2, title: "Valid Parentheses", difficulty: "Easy",
    methodName: "isValid",
    params: [{name:"s", type:"string"}] as ProblemParam[],
    returnType: "boolean" as const,
    tags: ["String", "Stack"], likes: 9812, dislikes: 201,
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: "true", explanation: "" },
      { input: 's = "()[]{}"', output: "true", explanation: "" },
      { input: 's = "(]"', output: "false", explanation: "" },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'."],
    defaultCode: {
      javascript: `function isValid(s) {\n    // Write your solution here\n    \n};`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your solution here\n        pass`,
      typescript: `function isValid(s: string): boolean {\n    // Write your solution here\n    \n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        \n    }\n}`,
    },
  },
  {
    id: 3, title: "Merge Two Sorted Lists", difficulty: "Easy",
    methodName: "mergeTwoLists",
    params: [{name:"list1", type:"ListNode"}, {name:"list2", type:"ListNode"}] as ProblemParam[],
    returnType: "ListNode" as const,
    tags: ["Linked List", "Recursion"], likes: 8445, dislikes: 156,
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.\n\nMerge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.`,
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "" },
      { input: "list1 = [], list2 = []", output: "[]", explanation: "" },
    ],
    constraints: ["The number of nodes in both lists is in the range [0, 50].", "-100 ≤ Node.val ≤ 100"],
    defaultCode: {
      javascript: `function mergeTwoLists(list1, list2) {\n    // Write your solution here\n    \n};`,
      python: `class Solution:\n    def mergeTwoLists(self, list1, list2):\n        # Write your solution here\n        pass`,
      typescript: `function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n    // Write your solution here\n    \n};`,
      java: `class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your solution here\n        \n    }\n}`,
    },
  },
  {
    id: 4, title: "Best Time to Buy and Sell Stock", difficulty: "Easy",
    methodName: "maxProfit",
    params: [{name:"prices", type:"int[]"}] as ProblemParam[],
    returnType: "int" as const,
    tags: ["Array", "Dynamic Programming"], likes: 11234, dislikes: 289,
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`ith\` day.\n\nYou want to maximize your profit by choosing a single day to buy and another day in the future to sell.\n\nReturn the maximum profit you can achieve. If no profit, return 0.`,
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "No profitable transaction possible." },
    ],
    constraints: ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"],
    defaultCode: {
      javascript: `function maxProfit(prices) {\n    // Write your solution here\n    \n};`,
      python: `class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write your solution here\n        pass`,
      typescript: `function maxProfit(prices: number[]): number {\n    // Write your solution here\n    \n};`,
      java: `class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution here\n        \n    }\n}`,
    },
  },
  {
    id: 5, title: "Contains Duplicate", difficulty: "Easy",
    methodName: "containsDuplicate",
    params: [{name:"nums", type:"int[]"}] as ProblemParam[],
    returnType: "boolean" as const,
    tags: ["Array", "Hash Table", "Sorting"], likes: 7632, dislikes: 412,
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    examples: [
      { input: "nums = [1,2,3,1]", output: "true", explanation: "" },
      { input: "nums = [1,2,3,4]", output: "false", explanation: "" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁹ ≤ nums[i] ≤ 10⁹"],
    defaultCode: {
      javascript: `function containsDuplicate(nums) {\n    // Write your solution here\n    \n};`,
      python: `class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        # Write your solution here\n        pass`,
      typescript: `function containsDuplicate(nums: number[]): boolean {\n    // Write your solution here\n    \n};`,
      java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        \n    }\n}`,
    },
  },
];

const LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  typescript: "typescript",
  java: "java",
};

interface TestResult {
  id: number;
  input: string;
  expected: string;
  output: string;
  passed: boolean;
  time: string;
}

// Simple markdown-like renderer
function renderDescription(text: string) {
  return text.split("\n").map((line, i) => {
    const rendered = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">$1</code>');
    return <p key={i} className="text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered || "&nbsp;" }} />;
  });
}

export default function CodeEditorPage() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [problemIdx, setProblemIdx] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [codePerLang, setCodePerLang] = useState<Record<string, Record<string, string>>>({});
  const [activeTab, setActiveTab] = useState("description");
  const [bottomTab, setBottomTab] = useState("testcase");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [disliked, setDisliked] = useState<Record<number, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [expandedSolution, setExpandedSolution] = useState<number | null>(null);

  const problem = PROBLEMS[problemIdx];

  const getCode = () => {
    return codePerLang[problem.id]?.[language] ?? problem.defaultCode[language as keyof typeof problem.defaultCode] ?? "";
  };

  const setCode = (value: string) => {
    setCodePerLang((prev) => ({
      ...prev,
      [problem.id]: { ...(prev[problem.id] || {}), [language]: value },
    }));
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // Code is preserved per language automatically
  };

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setBottomTab("result");
    try {
      const code = getCode();
      const wrappedCode = wrapCode(code, language, {
        methodName: problem.methodName,
        params: problem.params,
        returnType: problem.returnType,
      });
      const result = await executeCode({ language, code: wrappedCode, stdin: problem.examples[0]?.input || "" });
      setTestResults([{
        id: 1,
        input: problem.examples[0]?.input || "",
        expected: problem.examples[0]?.output || "",
        output: result.stdout || result.stderr || "(no output)",
        passed: (result.stdout || "").trim() === (problem.examples[0]?.output || "").trim(),
        time: result.time ? `${result.time}ms` : "—",
      }]);
    } catch (err: any) {
      setTestResults([{
        id: 1,
        input: problem.examples[0]?.input || "",
        expected: problem.examples[0]?.output || "",
        output: err.message || "Execution failed",
        passed: false,
        time: "—",
      }]);
    } finally {
      setIsRunning(false);
    }
  }, [problem, language, getCode]);

  const handleSubmit = useCallback(async () => {
    setIsRunning(true);
    setBottomTab("result");
    try {
      const code = getCode();
      const wrappedCode = wrapCode(code, language, {
        methodName: problem.methodName,
        params: problem.params,
        returnType: problem.returnType,
      });
      const results: TestResult[] = [];
      for (let i = 0; i < problem.examples.length; i++) {
        const ex = problem.examples[i];
        try {
          const result = await executeCode({ language, code: wrappedCode, stdin: ex.input });
          const output = (result.stdout || result.stderr || "(no output)").trim();
          results.push({
            id: i + 1,
            input: ex.input,
            expected: ex.output,
            output,
            passed: output === ex.output.trim(),
            time: result.time ? `${result.time}ms` : "—",
          });
        } catch (err: any) {
          results.push({
            id: i + 1,
            input: ex.input,
            expected: ex.output,
            output: err.message || "Execution failed",
            passed: false,
            time: "—",
          });
        }
      }
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  }, [problem, language, getCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmit();
        } else {
          handleRun();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun, handleSubmit]);

  const difficultyColor: Record<string, string> = {
    Easy: "text-green-600 dark:text-green-400",
    Medium: "text-yellow-600 dark:text-yellow-400",
    Hard: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={String(problemIdx)} onValueChange={(v) => { setProblemIdx(Number(v)); setTestResults(null); }}>
            <SelectTrigger className="w-[260px] h-8 rounded-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROBLEMS.map((p, i) => (
                <SelectItem key={p.id} value={String(i)}>
                  {p.id}. {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className={`text-sm font-semibold ${difficultyColor[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleRun}
            disabled={isRunning}
          >
            <Play className="h-4 w-4" />
            Run
          </Button>
          <Button
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleSubmit}
            disabled={isRunning}
          >
            <Send className="h-4 w-4" />
            Submit
          </Button>
        </div>
      </div>

      {/* Main split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-2xl border border-border overflow-hidden bg-card/60 backdrop-blur-sm">
        {/* Left panel — Problem */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 pt-2">
                <TabsTrigger value="description" className="rounded-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  Description
                </TabsTrigger>
                <TabsTrigger value="editorial" className="rounded-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  Editorial
                </TabsTrigger>
                <TabsTrigger value="solutions" className="rounded-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                  Solutions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="flex-1 overflow-y-auto p-5 m-0 space-y-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                <div className="prose prose-sm max-w-none space-y-1">
                  {renderDescription(problem.description)}
                </div>

                {/* Examples */}
                <div className="space-y-4">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Example {i + 1}:</h4>
                      <div className="rounded-xl bg-muted/50 border border-border p-4 font-mono text-sm space-y-1">
                        <div><span className="text-muted-foreground">Input: </span><span className="text-foreground">{ex.input}</span></div>
                        <div><span className="text-muted-foreground">Output: </span><span className="text-primary font-semibold">{ex.output}</span></div>
                        {ex.explanation && (
                          <div><span className="text-muted-foreground">Explanation: </span><span className="text-foreground/80">{ex.explanation}</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Constraints:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="font-mono text-xs">{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 text-muted-foreground pt-2">
                  <button
                    onClick={() => { setLiked(prev => ({ ...prev, [problem.id]: !prev[problem.id] })); if (disliked[problem.id]) setDisliked(prev => ({ ...prev, [problem.id]: false })); }}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${liked[problem.id] ? "text-primary" : "hover:text-primary"}`}
                    aria-label="Like"
                  >
                    <ThumbsUp className="h-4 w-4" /> {problem.likes + (liked[problem.id] ? 1 : 0)}
                  </button>
                  <button
                    onClick={() => { setDisliked(prev => ({ ...prev, [problem.id]: !prev[problem.id] })); if (liked[problem.id]) setLiked(prev => ({ ...prev, [problem.id]: false })); }}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${disliked[problem.id] ? "text-destructive" : "hover:text-destructive"}`}
                    aria-label="Dislike"
                  >
                    <ThumbsDown className="h-4 w-4" /> {problem.dislikes + (disliked[problem.id] ? 1 : 0)}
                  </button>
                  <button
                    onClick={() => setBookmarked(prev => ({ ...prev, [problem.id]: !prev[problem.id] }))}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${bookmarked[problem.id] ? "text-accent" : "hover:text-accent"}`}
                    aria-label="Bookmark"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toast({ title: "Link copied!", description: "Problem link copied to clipboard." })}
                    className="flex items-center gap-1.5 text-sm hover:text-accent transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="editorial" className="flex-1 overflow-y-auto p-5 m-0 space-y-4">
                {(() => {
                  const editorials: Record<number, { approach: string; steps: string[]; time: string; space: string }> = {
                    1: { approach: "Hash Map", steps: ["Create an empty hash map to store values and their indices.", "Iterate through the array. For each element, calculate the complement (target - current).", "Check if the complement exists in the hash map. If it does, return both indices.", "If not, add the current element and its index to the hash map."], time: "O(n)", space: "O(n)" },
                    2: { approach: "Stack", steps: ["Initialize an empty stack.", "Iterate through each character in the string.", "If the character is an opening bracket, push it onto the stack.", "If it's a closing bracket, check if the stack is non-empty and the top matches. If not, return false.", "After iteration, return true if the stack is empty."], time: "O(n)", space: "O(n)" },
                    3: { approach: "Iterative Merge", steps: ["Create a dummy head node.", "Compare the heads of both lists and attach the smaller one to the merged list.", "Move the pointer of the list from which the node was taken.", "After one list is exhausted, attach the remaining nodes of the other list."], time: "O(n + m)", space: "O(1)" },
                    4: { approach: "One-Pass Min Tracking", steps: ["Initialize minPrice to Infinity and maxProfit to 0.", "Iterate through each price in the array.", "Update minPrice if the current price is lower than minPrice.", "Compute profit as currentPrice − minPrice, and update maxProfit if this profit is larger."], time: "O(n)", space: "O(1)" },
                    5: { approach: "Hash Set", steps: ["Create an empty hash set.", "Iterate through each element in the array.", "If the element already exists in the set, return true (duplicate found).", "Otherwise, add the element to the set. If the loop finishes, return false."], time: "O(n)", space: "O(n)" },
                  };
                  const ed = editorials[problem.id] || editorials[1];
                  return (
                    <>
                      <h3 className="text-base font-semibold text-foreground">Approach: {ed.approach}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {ed.steps.map((step, i) => (
                          <p key={i}><strong className="text-foreground">Step {i + 1}:</strong> {step}</p>
                        ))}
                      </div>
                      <div className="rounded-xl bg-muted/50 border border-border p-4 font-mono text-xs">
                        <p className="text-muted-foreground">Time Complexity: {ed.time}</p>
                        <p className="text-muted-foreground">Space Complexity: {ed.space}</p>
                      </div>
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="solutions" className="flex-1 overflow-y-auto p-5 m-0 space-y-3">
                {(() => {
                  const SOLUTIONS: Record<number, { author: string; lang: string; votes: number; time: string; code: string }[]> = {
                    1: [
                      { author: "Alice C.", lang: "Python", votes: 234, time: "2 weeks ago", code: "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        comp = target - n\n        if comp in seen:\n            return [seen[comp], i]\n        seen[n] = i" },
                      { author: "Bob K.", lang: "JavaScript", votes: 189, time: "1 month ago", code: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n}" },
                    ],
                    2: [
                      { author: "Dan W.", lang: "Python", votes: 198, time: "1 week ago", code: "def isValid(s):\n    stack = []\n    pairs = {')': '(', '}': '{', ']': '['}\n    for c in s:\n        if c in pairs.values():\n            stack.append(c)\n        elif c in pairs:\n            if not stack or stack[-1] != pairs[c]:\n                return False\n            stack.pop()\n    return len(stack) == 0" },
                      { author: "Eva M.", lang: "JavaScript", votes: 165, time: "3 weeks ago", code: "function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const c of s) {\n    if ('({['.includes(c)) stack.push(c);\n    else if (stack.pop() !== map[c]) return false;\n  }\n  return stack.length === 0;\n}" },
                    ],
                    3: [
                      { author: "Faye L.", lang: "Python", votes: 210, time: "2 weeks ago", code: "def mergeTwoLists(l1, l2):\n    dummy = ListNode(0)\n    curr = dummy\n    while l1 and l2:\n        if l1.val <= l2.val:\n            curr.next = l1\n            l1 = l1.next\n        else:\n            curr.next = l2\n            l2 = l2.next\n        curr = curr.next\n    curr.next = l1 or l2\n    return dummy.next" },
                      { author: "Greg T.", lang: "JavaScript", votes: 145, time: "1 month ago", code: "function mergeTwoLists(l1, l2) {\n  if (!l1) return l2;\n  if (!l2) return l1;\n  if (l1.val <= l2.val) {\n    l1.next = mergeTwoLists(l1.next, l2);\n    return l1;\n  }\n  l2.next = mergeTwoLists(l1, l2.next);\n  return l2;\n}" },
                    ],
                    4: [
                      { author: "Hana S.", lang: "Python", votes: 276, time: "1 week ago", code: "def maxProfit(prices):\n    min_price = float('inf')\n    max_profit = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        max_profit = max(max_profit, price - min_price)\n    return max_profit" },
                      { author: "Ivan P.", lang: "JavaScript", votes: 201, time: "2 weeks ago", code: "function maxProfit(prices) {\n  let minPrice = Infinity, maxProfit = 0;\n  for (const price of prices) {\n    minPrice = Math.min(minPrice, price);\n    maxProfit = Math.max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}" },
                    ],
                    5: [
                      { author: "Jade K.", lang: "Python", votes: 188, time: "3 weeks ago", code: "def containsDuplicate(nums):\n    return len(nums) != len(set(nums))" },
                      { author: "Kyle R.", lang: "JavaScript", votes: 162, time: "1 month ago", code: "function containsDuplicate(nums) {\n  const seen = new Set();\n  for (const n of nums) {\n    if (seen.has(n)) return true;\n    seen.add(n);\n  }\n  return false;\n}" },
                    ],
                  };
                  const solutions = SOLUTIONS[problem.id] || SOLUTIONS[1];
                  return solutions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => setExpandedSolution(expandedSolution === i ? null : i)}
                    className="rounded-xl border border-border/50 bg-secondary/20 p-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.author}</p>
                        <p className="text-xs text-muted-foreground">{s.lang} • {s.time}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">▲ {s.votes}</Badge>
                    </div>
                    {expandedSolution === i && (
                      <pre className="mt-3 rounded-lg bg-muted/50 border border-border p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                        {s.code}
                      </pre>
                    )}
                  </div>
                  ));
                })()}
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel — Editor + Console */}
        <ResizablePanel defaultSize={60} minSize={35}>
          <ResizablePanelGroup direction="vertical">
            {/* Code editor */}
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="flex h-full flex-col">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[160px] h-8 rounded-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Monaco */}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={LANG_MAP[language]}
                    value={getCode()}
                    onChange={(v) => setCode(v || "")}
                    theme={theme === "dark" ? "vs-dark" : "light"}
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      lineNumbers: "on",
                      renderLineHighlight: "line",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                      bracketPairColorization: { enabled: true },
                      autoClosingBrackets: "always",
                      tabSize: 4,
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom — Test cases / Results */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex flex-col h-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 pt-1">
                  <TabsTrigger value="testcase" className="rounded-full text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Test Cases
                  </TabsTrigger>
                  <TabsTrigger value="result" className="rounded-full text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Results
                    {testResults && (
                      <span className="ml-1.5">
                        {testResults.every((t) => t.passed) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 inline" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 inline" />
                        )}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="testcase" className="flex-1 overflow-y-auto p-4 m-0 space-y-3">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="rounded-xl bg-muted/40 border border-border p-3 font-mono text-xs space-y-1">
                      <div className="text-muted-foreground">Case {i + 1}</div>
                      <div className="text-foreground">{ex.input}</div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="result" className="flex-1 overflow-y-auto p-4 m-0">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Running tests…
                    </div>
                  ) : testResults ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {testResults.every((t) => t.passed) ? (
                          <Badge className="rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            All Passed
                          </Badge>
                        ) : (
                          <Badge className="rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Some Failed
                          </Badge>
                        )}
                      </div>
                      {testResults.map((t) => (
                        <div
                          key={t.id}
                          className={`rounded-xl border p-3 font-mono text-xs space-y-1 ${
                            t.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">Case {t.id}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" /> {t.time}
                            </span>
                          </div>
                          <div><span className="text-muted-foreground">Input: </span>{t.input}</div>
                          <div><span className="text-muted-foreground">Expected: </span>{t.expected}</div>
                          <div>
                            <span className="text-muted-foreground">Output: </span>
                            <span className={t.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{t.output}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Run or submit your code to see results.</p>
                  )}
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
