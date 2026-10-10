import type { Question, StudyPlan } from "../types";
import neetcode150 from "./neetcode150.json";

export const DEFAULT_PLAN_ID = "starter-10";

const starterTitles = [
  "Two Sum",
  "Valid Parentheses",
  "Best Time to Buy and Sell Stock",
  "Binary Search",
  "Reverse Linked List",
  "Maximum Depth of Binary Tree",
  "Climbing Stairs",
  "Merge Intervals",
  "Number of Islands",
  "LRU Cache",
];

const blind75Titles = [
  "Contains Duplicate", "Valid Anagram", "Two Sum", "Group Anagrams",
  "Top K Frequent Elements", "Product of Array Except Self", "Encode and Decode Strings",
  "Longest Consecutive Sequence", "Valid Palindrome", "3Sum", "Container With Most Water",
  "Best Time to Buy and Sell Stock", "Longest Substring Without Repeating Characters",
  "Longest Repeating Character Replacement", "Minimum Window Substring", "Valid Parentheses",
  "Find Minimum In Rotated Sorted Array", "Search In Rotated Sorted Array", "Reverse Linked List",
  "Merge Two Sorted Lists", "Reorder List", "Remove Nth Node From End of List", "Linked List Cycle",
  "Merge K Sorted Lists", "Invert Binary Tree", "Maximum Depth of Binary Tree", "Same Tree",
  "Subtree of Another Tree", "Lowest Common Ancestor of a Binary Search Tree",
  "Validate Binary Search Tree", "Construct Binary Tree From Preorder And Inorder Traversal",
  "Binary Tree Level Order Traversal", "Kth Smallest Element In a Bst", "Binary Tree Maximum Path Sum",
  "Serialize And Deserialize Binary Tree", "Implement Trie Prefix Tree", "Word Search II",
  "Design Add And Search Words Data Structure", "Find Median From Data Stream", "Combination Sum",
  "Word Search", "Number of Islands", "Pacific Atlantic Water Flow", "Clone Graph", "Course Schedule",
  "Number of Connected Components In An Undirected Graph", "Graph Valid Tree", "Alien Dictionary",
  "Climbing Stairs", "House Robber", "House Robber II", "Decode Ways", "Palindromic Substrings",
  "Longest Palindromic Substring", "Coin Change", "Word Break", "Maximum Product Subarray",
  "Longest Increasing Subsequence", "Unique Paths", "Longest Common Subsequence", "Maximum Subarray",
  "Jump Game", "Insert Interval", "Merge Intervals", "Non Overlapping Intervals", "Meeting Rooms",
  "Meeting Rooms II", "Rotate Image", "Spiral Matrix", "Set Matrix Zeroes", "Number of 1 Bits",
  "Counting Bits", "Reverse Bits", "Missing Number", "Sum of Two Integers",
];

const urlByTitle = new Map(neetcode150.map((question) => [question.title.toLowerCase(), question.url]));

function urlsForTitles(titles: string[]): string[] {
  return titles.map((title) => {
    const url = urlByTitle.get(title.toLowerCase());
    if (!url) throw new Error(`Study plan question not found: ${title}`);
    return url;
  });
}

export const studyPlans: StudyPlan[] = [
  {
    id: "neetcode-150",
    name: "NeetCode 150",
    sourceUrl: "https://neetcode.io/practice/practice/neetcode150",
    questionUrls: neetcode150.map((question) => question.url),
  },
  {
    id: "blind-75",
    name: "Blind 75",
    sourceUrl: "https://neetcode.io/practice/practice/blind75",
    questionUrls: urlsForTitles(blind75Titles),
  },
  {
    id: DEFAULT_PLAN_ID,
    name: "Starter 10",
    questionUrls: urlsForTitles(starterTitles),
  },
  {
    id: "personal",
    name: "My questions",
    custom: true,
  },
];

export function getStudyPlan(planId: string): StudyPlan {
  return studyPlans.find((plan) => plan.id === planId) ?? studyPlans.find((plan) => plan.id === DEFAULT_PLAN_ID)!;
}

export function getQuestionsForPlan(planId: string, questions: Question[]): Question[] {
  const plan = getStudyPlan(planId);
  if (plan.custom) return questions.filter((question) => !question.builtIn);
  const urls = new Set(plan.questionUrls);
  return questions.filter((question) => urls.has(question.url));
}
