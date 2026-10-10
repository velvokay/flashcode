import type { Question } from "../types";
import neetcode150 from "./neetcode150.json";

const createdAt = "2026-01-01T00:00:00.000Z";

const featuredQuestions: Question[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    topic: "Arrays",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/two-sum/",
    prompt:
      "Given an array and a target, return the two indices whose values add to the target. Aim for one pass.",
    approach: [
      "Scan once while storing each value's index in a hash map.",
      "For each value, check whether target minus value has already been seen.",
      "Return the stored index and the current index when the complement exists.",
    ],
    complexity: "O(n) time · O(n) space",
    builtIn: true,
    createdAt,
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    topic: "Stacks",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/valid-parentheses/",
    prompt:
      "Decide whether every opening bracket is closed by the correct bracket in the correct order.",
    approach: [
      "Push opening brackets onto a stack.",
      "For a closing bracket, the stack top must be its matching opener.",
      "The input is valid only if the stack is empty at the end.",
    ],
    complexity: "O(n) time · O(n) space",
    builtIn: true,
    createdAt,
  },
  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    topic: "Arrays",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    prompt:
      "Choose one buy day and one later sell day to maximize profit. Return zero when no profit is possible.",
    approach: [
      "Track the lowest price seen so far.",
      "At each day, compare the current price against that minimum.",
      "Keep the largest profit found; ordering is preserved by the scan.",
    ],
    complexity: "O(n) time · O(1) space",
    builtIn: true,
    createdAt,
  },
  {
    id: "binary-search",
    title: "Binary Search",
    topic: "Search",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/binary-search/",
    prompt:
      "Find a target in a sorted array and return its index, or −1 when it is absent.",
    approach: [
      "Maintain inclusive left and right bounds.",
      "Inspect the midpoint and discard the half that cannot contain the target.",
      "Use left + floor((right − left) / 2) for a safe midpoint.",
    ],
    complexity: "O(log n) time · O(1) space",
    builtIn: true,
    createdAt,
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    topic: "Linked lists",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/reverse-linked-list/",
    prompt:
      "Reverse a singly linked list and return its new head without allocating another list.",
    approach: [
      "Keep previous, current, and next pointers.",
      "Save current.next before redirecting it toward previous.",
      "Advance both pointers; previous is the new head when current is null.",
    ],
    complexity: "O(n) time · O(1) space",
    builtIn: true,
    createdAt,
  },
  {
    id: "maximum-depth-tree",
    title: "Maximum Depth of Binary Tree",
    topic: "Trees",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    prompt:
      "Return the number of nodes on the longest path from a binary tree's root to a leaf.",
    approach: [
      "An empty tree has depth zero.",
      "Recursively find the depth of the left and right subtrees.",
      "Return one plus the larger subtree depth.",
    ],
    complexity: "O(n) time · O(h) call stack",
    builtIn: true,
    createdAt,
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    topic: "Dynamic programming",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/climbing-stairs/",
    prompt:
      "Count the distinct ways to reach step n when each move climbs either one or two steps.",
    approach: [
      "Ways to reach a step equal the sum of the previous two step counts.",
      "Start from the base counts for zero and one step.",
      "Keep only the last two values instead of a full table.",
    ],
    complexity: "O(n) time · O(1) space",
    builtIn: true,
    createdAt,
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    topic: "Intervals",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/merge-intervals/",
    prompt:
      "Combine every pair of overlapping intervals and return the resulting non-overlapping ranges.",
    approach: [
      "Sort intervals by starting value.",
      "Compare each interval with the last merged range.",
      "Extend the last end when they overlap; otherwise append a new range.",
    ],
    complexity: "O(n log n) time · O(n) output",
    builtIn: true,
    createdAt,
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    topic: "Graphs",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/number-of-islands/",
    prompt:
      "Count connected groups of land cells in a grid where connections occur vertically and horizontally.",
    approach: [
      "Scan every cell and start a traversal whenever unvisited land is found.",
      "Use DFS or BFS to mark the entire connected component visited.",
      "Increment the island count once per traversal, not once per cell.",
    ],
    complexity: "O(rows × cols) time · O(rows × cols) space worst case",
    builtIn: true,
    createdAt,
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    topic: "Data structures",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/lru-cache/",
    prompt:
      "Design a fixed-capacity cache with constant-time get and put that evicts the least recently used entry.",
    approach: [
      "Use a hash map for constant-time lookup.",
      "Use a doubly linked list to maintain recency order.",
      "Move accessed nodes to the front and evict from the back at capacity.",
    ],
    complexity: "O(1) get · O(1) put · O(capacity) space",
    builtIn: true,
    createdAt,
  },
];

function slugFromUrl(url: string): string {
  return url.split("/problems/")[1]?.replaceAll("/", "") ?? url;
}

const featuredByUrl = new Map(featuredQuestions.map((question) => [question.url, question]));

function cleanTitle(title: string): string {
  return title
    .replace(/\b(And|In|From|With|To|Of|An|Is)\b/g, (word) => word.toLowerCase())
    .replace(/\bBst\b/g, "BST");
}

export const seedQuestions: Question[] = neetcode150.map((problem) => {
  const featured = featuredByUrl.get(problem.url);
  if (featured) return featured;

  return {
    id: slugFromUrl(problem.url),
    title: cleanTitle(problem.title),
    topic: problem.topic,
    difficulty: problem.difficulty as Question["difficulty"],
    url: problem.url,
    prompt: "Solve the problem on LeetCode, then return here to rate it.",
    approach: [],
    complexity: "",
    builtIn: true,
    createdAt,
  };
});
