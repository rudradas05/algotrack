import axios from "axios";

export interface LeetCodeMetadata {
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
}

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const GET_QUESTION_QUERY = `
  query getQuestion($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      difficulty
      topicTags {
        name
      }
    }
  }
`;

export async function fetchLeetCodeMetadata(
  slug: string,
): Promise<LeetCodeMetadata> {
  const response = await axios.post(LEETCODE_GRAPHQL_URL, {
    query: GET_QUESTION_QUERY,
    variables: { titleSlug: slug },
  });

  const question = response.data?.data?.question;

  if (!question) {
    throw new Error(`LeetCode question not found for slug: ${slug}`);
  }

  return {
    title: question.title,
    slug: question.titleSlug,
    difficulty: question.difficulty as "Easy" | "Medium" | "Hard",
    topic:
      question.topicTags && question.topicTags.length > 0
        ? question.topicTags[0].name
        : "Uncategorized",
  };
}
