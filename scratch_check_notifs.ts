import "dotenv/config";
import { sendGraphQL } from "./src/graphql";

async function checkNotifications() {
  const query = `
    query CheckAllNotifications {
      aa_s_notifications(order_by: { id: desc }, limit: 10) {
        id
        account_company_id
        title
        message
        type
        priority
        read
        timestamp
        action_url
        related_entity_type
        related_entity_id
        created_at
      }
    }
  `;

  try {
    const res = await sendGraphQL({ query, operationName: "CheckAllNotifications" });
    console.log("NOTIFICATIONS IN DB:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error querying notifications:", e);
  }
  process.exit(0);
}

checkNotifications();
