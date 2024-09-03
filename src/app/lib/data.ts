import {createClient, sql} from "@vercel/postgres";
import {unstable_noStore as noStore} from "next/cache";

export async function connectToDB() {
    const client = createClient();
    await client.connect();

    try {
        if (client) {
            console.log('connected to database');
            return client;
        }
    } catch (e) {
        console.error('Error connecting to database', e);
    }
}

export async function getPosts() {
    try {
        noStore();
        const data = await sql`SELECT * FROM posts`;
        // console.log(data.rows);
        return data.rows;
    } catch (e) {
        console.log("Error getting posts", e);
    }
}