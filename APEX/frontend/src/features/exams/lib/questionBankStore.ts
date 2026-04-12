import type { QuestionType } from "@/features/exams/types/exam";

export interface MCQData {
  options: string[];
  correctIndices: number[];
  explanation: string;
}

export interface WrittenData {
  rubric: string;
  maxWordCount: number;
}

export interface CodingData {
  description: string;
  starterCode: string;
  hints: string;
}

export interface BankQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  courseId: string;
  tags: string[];
  createdAt: string;
  mcqData?: MCQData;
  writtenData?: WrittenData;
  codingData?: CodingData;
}

const STORAGE_KEY = "apex-question-bank";

const seedQuestions: BankQuestion[] = [
  { id: "qb-1", type: "mcq", text: "What is the time complexity of binary search?", points: 10, courseId: "APX-CS301", tags: ["searching", "complexity"], createdAt: "2026-03-15", mcqData: { options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctIndices: [1], explanation: "Binary search halves the search space each step." } },
  { id: "qb-2", type: "written", text: "Explain the difference between a stack and a queue.", points: 20, courseId: "APX-CS201", tags: ["data-structures", "fundamentals"], createdAt: "2026-03-10", writtenData: { rubric: "Must mention LIFO vs FIFO, provide examples.", maxWordCount: 500 } },
  { id: "qb-3", type: "coding", text: "Implement a function to reverse a linked list.", points: 30, courseId: "APX-CS201", tags: ["linked-list", "implementation"], createdAt: "2026-03-08", codingData: { description: "Write a function that takes the head of a singly linked list and returns the reversed list.", starterCode: "def reverse_list(head):\n    pass", hints: "Use three pointers: prev, curr, next" } },
  { id: "qb-4", type: "mcq", text: "Which of the following is not a primitive data type in Python?", points: 10, courseId: "APX-CS101", tags: ["python", "basics"], createdAt: "2026-03-05", mcqData: { options: ["int", "str", "list", "float"], correctIndices: [2], explanation: "list is a collection type, not a primitive." } },
  { id: "qb-5", type: "written", text: "Describe the concept of recursion with an example.", points: 20, courseId: "APX-CS101", tags: ["recursion", "fundamentals"], createdAt: "2026-03-01", writtenData: { rubric: "Define recursion, base case, recursive case, provide code example.", maxWordCount: 400 } },
  { id: "qb-6", type: "coding", text: "Write a function that finds the shortest path in a graph using BFS.", points: 30, courseId: "APX-CS301", tags: ["graphs", "bfs"], createdAt: "2026-02-28", codingData: { description: "Implement BFS to find shortest path from source to target in unweighted graph.", starterCode: "def bfs_shortest_path(graph, source, target):\n    pass", hints: "Use a queue and visited set" } },
  { id: "qb-7", type: "mcq", text: "What is the worst case time complexity of quicksort?", points: 10, courseId: "APX-CS301", tags: ["sorting", "complexity"], createdAt: "2026-02-20", mcqData: { options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], correctIndices: [1], explanation: "Worst case occurs with already sorted input and bad pivot." } },
  { id: "qb-8", type: "written", text: "Compare and contrast arrays and linked lists.", points: 15, courseId: "APX-CS201", tags: ["data-structures", "comparison"], createdAt: "2026-02-15", writtenData: { rubric: "Compare access time, insertion, deletion, memory usage.", maxWordCount: 600 } },
];

function loadFromStorage(): BankQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Seed on first load
  saveToStorage(seedQuestions);
  return seedQuestions;
}

function saveToStorage(questions: BankQuestion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function getQuestions(): BankQuestion[] {
  return loadFromStorage();
}

export function addQuestion(q: BankQuestion): BankQuestion[] {
  const all = loadFromStorage();
  const updated = [q, ...all];
  saveToStorage(updated);
  return updated;
}

export function updateQuestion(id: string, partial: Partial<BankQuestion>): BankQuestion[] {
  const all = loadFromStorage();
  const updated = all.map((q) => (q.id === id ? { ...q, ...partial } : q));
  saveToStorage(updated);
  return updated;
}

export function deleteQuestion(id: string): BankQuestion[] {
  const all = loadFromStorage().filter((q) => q.id !== id);
  saveToStorage(all);
  return all;
}

export function deleteQuestions(ids: Set<string>): BankQuestion[] {
  const all = loadFromStorage().filter((q) => !ids.has(q.id));
  saveToStorage(all);
  return all;
}
