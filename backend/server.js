const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let client;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function connectToMongoDB() {
  client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();
  console.log("Connected to MongoDB");
}

connectToMongoDB();

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

app.post("/api/chat", async (req, res) => {
  const { message: query } = req.body;

  try {
    const db = client.db("your_database_name");
    const collection = db.collection("embedded_documents");

    const queryVector = await generateEmbedding(query);

    const pipeline = [
      {
        $vectorSearch: {
          index: "cosine_search",
          path: "metadata.vector_embedding",
          queryVector: queryVector,
          numCandidates: 600,
          limit: 50
        }
      },
      {
    $group: {
      _id: null,
      docs: {
        $push: "$$ROOT"
      }
    }
  },
  {
    $unwind: {
      path: "$docs",
      includeArrayIndex: "rank"
    }
  },
  {
    $addFields: {
      vs_score: {
        $multiply: [
          0.1,
          {
            $divide: [
              1.0,
              {
                $add: ["$rank", 60]
              }
            ]
          }
        ]
      }
    }
  },
  {
    $project: {
      vs_score: 1,
      _id: "$docs._id",
      filename: "$docs.metadata.filename",
      content: "$docs.content",
      is_image: "$docs.metadata.is_image",
      image: "$docs.metadata.image",
      page_number: "$docs.metadata.page_number"
    }
  },
  {
    $unionWith: {
      coll: "embedded_documents",
      pipeline: [
        {
          $search: {
            index: "name_search",
            text: {
              query: "ESG ",
              path: "content"
            }
          }
        },
        {
          $limit: 20
        },
        {
          $group: {
            _id: null,
            docs: {
              $push: "$$ROOT"
            }
          }
        },
        {
          $unwind: {
            path: "$docs",
            includeArrayIndex: "rank"
          }
        },
        {
          $addFields: {
            fts_score: {
              $multiply: [
                0.9,
                {
                  $divide: [
                    1.0,
                    {
                      $add: ["$rank", 60]
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            fts_score: 1,
            _id: "$docs._id",
            filename: "$docs.metadata.filename",
            content: "$docs.content",
            is_image: "$docs.metadata.is_image",
            image: "$docs.metadata.image",
            page_number:
              "$docs.metadata.page_number"
          }
        }
      ]
    }
  },
  {
    $group: {
      _id: "$_id",
      filename: {
        $first: "$filename"
      },
      content: {
        $first: "$content"
      },
      is_image: {
        $first: "$is_image"
      },
      image: {
        $first: "$image"
      },
      page_number: {
        $first: "$page_number"
      },
      vs_score: {
        $max: "$vs_score"
      },
      fts_score: {
        $max: "$fts_score"
      }
    }
  },
  {
    $project: {
      _id: 1,
      filename: 1,
      content: 1,
      is_image: 1,
      image: 1,
      page_number: 1,
      vs_score: {
        $ifNull: ["$vs_score", 0]
      },
      fts_score: {
        $ifNull: ["$fts_score", 0]
      }
    }
  },
  {
    $addFields: {
      score: {
        $add: ["$fts_score", "$vs_score"]
      }
    }
  },
  {
    $sort: {
      score: -1
    }
  },
  {
    $limit: 10
  }
    ];

    const results = await collection.aggregate(pipeline).toArray();

    // Process the results
    let contextText = "";
    let images = [];
    let sources = new Set();

    results.forEach((doc, index) => {
      contextText += `[${index + 1}] ${doc.content}\n\n`;
      if (doc.is_image && doc.image) {
        images.push({
          base64: doc.image,
          source: doc.filename,
          page_number: doc.page_number
        });
      }
      sources.add(`${doc.metadata.filename} (Page ${doc.metadata.page_number})`);
    });

    // Create the prompt for GPT-4
    const prompt = `
You are an AI assistant tasked with answering mails based on the provided context. You work for AchiMed an investment fund specialized in medical companies. Use the following information to answer the following mail:

Context:
${contextText}

User Query: ${query}

Write an email to provide a comprehensive answer to the user's query using the given context.

At the end of your response, list the sources used in the following format including the page numbers:

Sources:
${Array.from(sources).join('\n')}

Answer:`;

    // Call GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content.trim();

    res.json({
      answer: answer,
      images: images
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});