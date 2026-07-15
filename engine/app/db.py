import os
from motor.motor_asyncio import AsyncIOMotorClient

# Get Mongo URI from environment, default to local if not set
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/aptitude")

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def connect_to_mongo():
    """Create database connection."""
    print(f"Connecting to MongoDB at {MONGO_URI}")
    db.client = AsyncIOMotorClient(MONGO_URI)

async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        print("Closing MongoDB connection")
        db.client.close()

def get_database():
    """Get the database instance."""
    if not db.client:
        raise RuntimeError("Database connection not initialized")
    return db.client.get_default_database()
