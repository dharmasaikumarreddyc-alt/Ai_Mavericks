import { NextRequest, NextResponse } from 'next/server';

// In-memory addresses storage (in production, use a real database)
interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

// Seed addresses
const addressesDB: Address[] = [
  {
    id: 'addr_001',
    label: 'Home',
    street: '3550 Lenox Rd NE, Suite 3000',
    city: 'Atlanta',
    state: 'Georgia',
    zipCode: '30326',
    isDefault: true,
  },
  {
    id: 'addr_002',
    label: 'Work',
    street: '3500 Lenox Rd NE',
    city: 'Atlanta',
    state: 'Georgia',
    zipCode: '30326',
    isDefault: false,
  },
  {
    id: 'addr_003',
    label: 'Family',
    street: '3393 Peachtree Rd NE',
    city: 'Atlanta',
    state: 'Georgia',
    zipCode: '30326',
    isDefault: false,
  },
];

// GET /api/addresses - Get all saved addresses
export async function GET() {
  return NextResponse.json({
    success: true,
    addresses: addressesDB,
  });
}

// POST /api/addresses - Add a new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, street, city, state, zipCode, isDefault } = body;

    if (!street || !city || !state || !zipCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      label: label || 'Address',
      street,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
    };

    // If new address is default, unset other defaults
    if (newAddress.isDefault) {
      addressesDB.forEach(addr => addr.isDefault = false);
    }

    addressesDB.push(newAddress);

    return NextResponse.json({
      success: true,
      address: newAddress,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add address' },
      { status: 500 }
    );
  }
}
