// import axios from "axios";

// export interface LeetCodeMetadata {
//   title: string;
//   slug: string;
//   difficulty: "Easy" | "Medium" | "Hard";
//   topic: string;
// }

// const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

// const GET_QUESTION_QUERY = `
//   query getQuestion($titleSlug: String!) {
//     question(titleSlug: $titleSlug) {
//       title
//       titleSlug
//       difficulty
//       topicTags {
//         name
//       }
//     }
//   }
// `;

// export async function fetchLeetCodeMetadata(
//   slug: string,
// ): Promise<LeetCodeMetadata> {
//   const response = await axios.post(LEETCODE_GRAPHQL_URL, {
//     query: GET_QUESTION_QUERY,
//     variables: { titleSlug: slug },
//   });

//   const question = response.data?.data?.question;

//   if (!question) {
//     throw new Error(`LeetCode question not found for slug: ${slug}`);
//   }

//   return {
//     title: question.title,
//     slug: question.titleSlug,
//     difficulty: question.difficulty as "Easy" | "Medium" | "Hard",
//     topic:
//       question.topicTags && question.topicTags.length > 0
//         ? question.topicTags[0].name
//         : "Uncategorized",
//   };
// }

import axios from "axios";

export interface LeetCodeMetadata {
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
}

interface LeetCodeTopicTag {
  name?: string;
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
  const response = await axios.post(
    LEETCODE_GRAPHQL_URL,
    {
      query: GET_QUESTION_QUERY,
      variables: { titleSlug: slug },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://leetcode.com",
        Origin: "https://leetcode.com",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    },
  );

  const question = response.data?.data?.question;

  if (!question) {
    throw new Error(`LeetCode question not found for slug: ${slug}`);
  }

  const normalizedTopics = Array.from(
    new Set(
      ((question.topicTags ?? []) as LeetCodeTopicTag[])
        .map((tag) => tag.name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  );

  return {
    title: question.title,
    slug: question.titleSlug,
    difficulty: question.difficulty as "Easy" | "Medium" | "Hard",
    topic:
      normalizedTopics.length > 0
        ? normalizedTopics.join(", ")
        : "Uncategorized",
  };
}
