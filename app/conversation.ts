import { Collection, MongoClient } from "mongodb";
import { ChatCompletionRequestMessageRoleEnum } from "openai";

export interface Message {
    content: string;
    role: ChatCompletionRequestMessageRoleEnum;
}

export interface Conversation {
    _id: string;
    userMessages: {
        _id: string;
        message: string;
    }[];
    messages: Message[];
}

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_DB,
    MONGO_PORT,
    MONGO_HOST,
    MONGODB_URI
} = process.env;

const connectionString = MONGODB_URI || `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD || '')}@${MONGO_HOST}:${MONGO_PORT}`;

export function createMongoClient() {
    return new MongoClient(connectionString);
}


export function getConversationCollection(mongoClient: MongoClient) : Collection<Conversation> {
    return mongoClient.db(MONGO_DB).collection<Conversation>('conversations');
}

export async function findOrCreateConversation(collection: Collection<Conversation>,  conversationId: string) {
    const conversation = await collection.findOne({ _id: conversationId });
    if (!conversation) {
        const newConversation = {
            _id: conversationId,
            userMessages: [],
            messages: []
        };
        await collection.insertOne(newConversation);

        return newConversation;
    }

    return conversation;
}