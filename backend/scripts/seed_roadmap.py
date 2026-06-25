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
            "title": "Phase A - Bangladesh: Dhaka Division",
            "description": "Cities, landmarks, and historic sites across the Dhaka Division.",
            "place_type": "Mixed",
            "priority": 1,
            "status": "pending",
            "total_places": 24,
            "names": ['Dhaka', 'Narayanganj', 'Gazipur', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail', 'Faridpur', 'Rajbari', 'Gopalganj', 'Madaripur', 'Shariatpur', 'Parliament House', 'Shaheed Minar', 'Lalbagh Fort', 'Ahsan Manzil', 'Liberation War Museum', 'National Museum', 'Bangabandhu Museum', 'Baitul Mukarram Mosque', 'Dhaka University', 'Hatirjheel Lake', 'Star Mosque', 'Baldha Garden', 'Paharpur Buddhist Monastery', 'Mahasthangarh', 'Sonargaon', 'Mainamati Ruins', 'Wari-Bateshwar']
        },
        {
            "title": "Phase B - Bangladesh: Chittagong Division",
            "description": "Cities, natural sites, and landmarks in the Chittagong Division.",
            "place_type": "Mixed",
            "priority": 2,
            "status": "pending",
            "total_places": 15,
            "names": ['Chittagong', "Cox's Bazar", 'Rangamati', 'Bandarban', 'Khagrachhari', 'Feni', 'Comilla', 'Brahmanbaria', 'Noakhali', 'Lakshmipur', 'Chandpur', "Cox's Bazar Beach", "Saint Martin's Island", 'Kaptai Lake', 'Nafakhum Waterfall', 'Boga Lake', 'Nilgiri Hills', 'Chimbuk Hill', 'Hinchhari Waterfall', 'Inani Beach', 'Teknaf Wildlife Sanctuary', 'Chittagong Port', 'Foys Lake', 'Patenga Beach', 'War Cemetery Comilla']
        },
        {
            "title": "Phase C - Bangladesh: All Other Divisions",
            "description": "Sylhet, Rajshahi, Khulna, Barisal, Mymensingh, Rangpur",
            "place_type": "Mixed",
            "priority": 3,
            "status": "pending",
            "total_places": 40,
            "names": ['Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Mymensingh', 'Rangpur', 'Bogra', 'Pabna', 'Dinajpur', 'Kuakata']
        },
        {
            "title": "Phase D - Bangladesh: Natural Geography",
            "description": "Rivers, forests, and haors across Bangladesh.",
            "place_type": "Natural",
            "priority": 4,
            "status": "pending",
            "total_places": 15,
            "names": ['Padma', 'Meghna', 'Jamuna', 'Surma', 'Karnaphuli', 'Brahmaputra', 'Teesta', 'Buriganga', 'Halda', 'Sundarbans', 'Modhupur', 'Hakaluki Haor', 'Tanguar Haor', 'Baikka Beel', 'Char Kukri Mukri']
        },
        {
            "title": "Phase E - Bangladesh: Heritage + Liberation War",
            "description": "Historical sites and monuments.",
            "place_type": "Historical",
            "priority": 5,
            "status": "pending",
            "total_places": 6,
            "names": ['Mujibnagar', 'Savar National Memorial', 'March 7 Speech Site', 'Sat Gombuj Mosque', 'Kantaji Temple', 'Sixty Dome Mosque']
        },
        {
            "title": "Phase F - World Cities",
            "description": "After BD complete: Asian capitals, European capitals, Top tourist cities.",
            "place_type": "City",
            "priority": 6,
            "status": "pending",
            "total_places": 100,
            "names": ['Tokyo', 'Paris', 'London', 'New York', 'Dubai', 'Singapore']
        },
        {
            "title": "Phase G - World Landmarks",
            "description": "UNESCO sites, Famous landmarks by continent.",
            "place_type": "Landmark",
            "priority": 7,
            "status": "pending",
            "total_places": 100,
            "names": ['Colosseum', 'Taj Mahal', 'Machu Picchu', 'Great Wall of China']
        },
        {
            "title": "Phase H - Natural Wonders",
            "description": "Mountains, rivers, deserts, forests worldwide.",
            "place_type": "Natural",
            "priority": 8,
            "status": "pending",
            "total_places": 100,
            "names": ['Mount Everest', 'Amazon River', 'Sahara Desert', 'Grand Canyon']
        }
    ]

    try:
        response = supabase.table("atlasmind_roadmap").upsert(phases).execute()
        print(f"Upserted {len(response.data)} segments")
    except Exception as e:
        print(f"Error seeding roadmap: {e}")

if __name__ == "__main__":
    seed_roadmap()
