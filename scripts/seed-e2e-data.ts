
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from '@next/env';
import type { Database } from "../types/database";

loadEnvConfig(process.cwd());

// Remove type imports that might not work directly with tsx in this context if not needed, 
// or ensure we use the Database definitions which are robust.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Error: Missing required environment variables");
    process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function seedE2EData() {
    console.log("🌱 Seeding E2E data...");

    // 1. Clean up existing data for the test
    const TEST_ITINERARY_SLUG = 'test-itinerary-slug';
    const TEST_USER_EMAIL = 'e2e-test-user@example.com';

    // Clean up by slug first if possible, or by user?
    // Easier to find the user and delete them (cascade should handle itinerary)

    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', TEST_USER_EMAIL)
        .single();

    if (existingUser) {
        console.log(`Cleaning up existing user: ${(existingUser as any).id}`);
        await supabase.from('users').delete().eq('id', (existingUser as any).id);
    }

    // 2. Create User
    console.log("Creating test user...");
    const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
            email: TEST_USER_EMAIL,
            name: 'E2E Test User',
            google_id: 'e2e-google-id-12345',
        } as any)
        .select()
        .single();

    if (userError || !user) {
        console.error("Failed to create user:", userError);
        process.exit(1);
    }
    const userId = (user as any).id;

    // 3. Create Itinerary (Public)
    console.log("Creating test itinerary...");
    const { data: itinerary, error: itinError } = await supabase
        .from('itineraries')
        .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            title: 'E2E Test Trip to Tokyo',
            destination: 'Tokyo',
            start_date: '2025-11-01',
            end_date: '2025-11-03',
            duration: 3,
            status: 'published',
            is_public: true,
            public_slug: TEST_ITINERARY_SLUG,
            view_count: 0
        } as any)
        .select()
        .single();

    if (itinError || !itinerary) {
        console.error("Failed to create itinerary:", itinError);
        process.exit(1);
    }
    const itineraryId = (itinerary as any).id;

    // 4. Create Day Schedule
    console.log("Creating day schedule...");
    const { data: day, error: dayError } = await supabase
        .from('day_schedules')
        .insert({
            id: crypto.randomUUID(),
            itinerary_id: itineraryId,
            day: 1,
            date: '2025-11-01',
            title: 'Day 1: Sightseeing',
            status: 'detailed'
        } as any)
        .select()
        .single();

    if (dayError || !day) {
        console.error("Failed to create day schedule:", dayError);
        process.exit(1);
    }
    const dayId = (day as any).id;

    // 5. Create Tourist Spot with Address
    console.log("Creating tourist spot with address...");
    const { error: spotError } = await supabase
        .from('tourist_spots')
        .insert({
            id: crypto.randomUUID(),
            day_schedule_id: dayId,
            name: 'Tokyo Tower',
            description: 'Iconic tower',
            location_lat: 35.6586,
            location_lng: 139.7454,
            location_address: '4-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan',
            category: 'sightseeing',
            order_index: 0
        } as any);

    if (spotError) {
        console.error("Failed to create tourist spot:", spotError);
        process.exit(1);
    }

    console.log("✅ E2E Data seeded successfully!");
}

seedE2EData()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
