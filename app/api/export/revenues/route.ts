import { createServiceRoleClient } from "@/lib/supabase/server";
import { convertToCSV, createCSVResponse } from "@/lib/utils/csv";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    // Fetch all revenues data
    const { data, error } = await supabase
      .from("revenues")
      .select("*");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: "No revenues data found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert to CSV
    const csv = convertToCSV(data);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `revenues_${timestamp}.csv`;

    // Return CSV response
    return createCSVResponse(csv, filename);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
