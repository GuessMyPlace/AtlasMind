import os
from supabase import create_client, Client
import json

def seed_roadmap():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    
    phases = [
        {
            "id": "r-1",
            "title": "Phase A - Bangladesh: Dhaka Division",
            "description": "Cities, landmarks, and historic sites across the Dhaka Division.",
            "type": "Mixed",
            "priority": "Priority 1",
            "status": "planned",
            "estimated_places": 24,
            "target_names": json.dumps(['Dhaka', 'Narayanganj', 'Gazipur', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail', 'Faridpur', 'Rajbari', 'Gopalganj', 'Madaripur', 'Shariatpur', 'Parliament House', 'Shaheed Minar', 'Lalbagh Fort', 'Ahsan Manzil', 'Liberation War Museum', 'National Museum', 'Bangabandhu Museum', 'Baitul Mukarram Mosque', 'Dhaka University', 'Hatirjheel Lake', 'Star Mosque', 'Baldha Garden', 'Paharpur Buddhist Monastery', 'Mahasthangarh', 'Sonargaon', 'Mainamati Ruins', 'Wari-Bateshwar'])
        },
        {
            "id": "r-2",
            "title": "Phase B - Bangladesh: Chittagong Division",
            "description": "Cities, natural sites, and landmarks in the Chittagong Division.",
            "type": "Mixed",
            "priority": "Priority 2",
            "status": "planned",
            "estimated_places": 15,
            "target_names": json.dumps(['Chittagong', "Cox's Bazar", 'Rangamati', 'Bandarban', 'Khagrachhari', 'Feni', 'Comilla', 'Brahmanbaria', 'Noakhali', 'Lakshmipur', 'Chandpur', "Cox's Bazar Beach", "Saint Martin's Island", 'Kaptai Lake', 'Nafakhum Waterfall', 'Boga Lake', 'Nilgiri Hills', 'Chimbuk Hill', 'Hinchhari Waterfall', 'Inani Beach', 'Teknaf Wildlife Sanctuary', 'Chittagong Port', 'Foys Lake', 'Patenga Beach', 'War Cemetery Comilla'])
        },
        {
            "id": "r-3",
            "title": "Phase C - Bangladesh: All Other Divisions",
            "description": "Sylhet, Rajshahi, Khulna, Barisal, Mymensingh, Rangpur",
            "type": "Mixed",
            "priority": "Priority 3",
            "status": "planned",
            "estimated_places": 40,
            "target_names": json.dumps(['Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Mymensingh', 'Rangpur', 'Bogra', 'Pabna', 'Dinajpur', 'Kuakata'])
        },
        {
            "id": "r-4",
            "title": "Phase D - Bangladesh: Natural Geography",
            "description": "Rivers, forests, and haors across Bangladesh.",
            "type": "Natural",
            "priority": "Priority 4",
            "status": "planned",
            "estimated_places": 15,
            "target_names": json.dumps(['Padma', 'Meghna', 'Jamuna', 'Surma', 'Karnaphuli', 'Brahmaputra', 'Teesta', 'Buriganga', 'Halda', 'Sundarbans', 'Modhupur', 'Hakaluki Haor', 'Tanguar Haor', 'Baikka Beel', 'Char Kukri Mukri'])
        },
        {
            "id": "r-5",
            "title": "Phase E - Bangladesh: Heritage + Liberation War",
            "description": "Historical sites and monuments.",
            "type": "Historical",
            "priority": "Priority 5",
            "status": "planned",
            "estimated_places": 6,
            "target_names": json.dumps(['Mujibnagar', 'Savar National Memorial', 'March 7 Speech Site', 'Sat Gombuj Mosque', 'Kantaji Temple', 'Sixty Dome Mosque'])
        },
        {
            "id": "r-6",
            "title": "Phase F - World Cities",
            "description": "After BD complete: Asian capitals, European capitals, Top tourist cities.",
            "type": "City",
            "priority": "Priority 6",
            "status": "planned",
            "estimated_places": 100,
            "target_names": json.dumps(['Tokyo', 'Paris', 'London', 'New York', 'Dubai', 'Singapore'])
        },
        {
            "id": "r-7",
            "title": "Phase G - World Landmarks",
            "description": "UNESCO sites, Famous landmarks by continent.",
            "type": "Landmark",
            "priority": "Priority 7",
            "status": "planned",
            "estimated_places": 100,
            "target_names": json.dumps(['Colosseum', 'Taj Mahal', 'Machu Picchu', 'Great Wall of China'])
        },
        {
            "id": "r-8",
            "title": "Phase H - Natural Wonders",
            "description": "Mountains, rivers, deserts, forests worldwide.",
            "type": "Natural",
            "priority": "Priority 8",
            "status": "planned",
            "estimated_places": 100,
            "target_names": json.dumps(['Mount Everest', 'Amazon River', 'Sahara Desert', 'Grand Canyon'])
        }
    ]

    try:
        response = supabase.table("atlasmind_roadmap").upsert(phases).execute()
        print(f"Upserted {len(response.data)} segments")
    except Exception as e:
        print(f"Error seeding roadmap: {e}")

if __name__ == "__main__":
    seed_roadmap()
