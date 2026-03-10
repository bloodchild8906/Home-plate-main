import { RequestHandler } from "express";
import { Member, ApiResponse, PaginatedResponse } from "@shared/api";

// Mock data
const mockMembers: Member[] = [
  {
    id: "member-1",
    email: "john@example.com",
    name: "John Doe",
    phone: "555-1234",
    loyaltyPoints: 2500,
    tier: "Gold",
    joinDate: "2023-01-15",
    lastVisit: "2024-03-08",
  },
  {
    id: "member-2",
    email: "jane@example.com",
    name: "Jane Smith",
    phone: "555-5678",
    loyaltyPoints: 1200,
    tier: "Silver",
    joinDate: "2023-06-20",
    lastVisit: "2024-03-05",
  },
];

export const getMembers: RequestHandler = (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const start = (page - 1) * limit;

  const paginatedMembers = mockMembers.slice(start, start + limit);

  const response: ApiResponse<PaginatedResponse<Member>> = {
    success: true,
    data: {
      data: paginatedMembers,
      total: mockMembers.length,
      page,
      limit,
    },
  };
  res.status(200).json(response);
};

export const getMemberById: RequestHandler = (req, res) => {
  const { id } = req.params;
  const member = mockMembers.find((m) => m.id === id);

  if (!member) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  res.status(200).json({
    success: true,
    data: member,
  });
};

export const createMember: RequestHandler = (req, res) => {
  const { email, name, phone } = req.body;

  const newMember: Member = {
    id: `member-${Date.now()}`,
    email,
    name,
    phone,
    loyaltyPoints: 0,
    tier: "Bronze",
    joinDate: new Date().toISOString().split("T")[0],
  };

  mockMembers.push(newMember);

  res.status(201).json({
    success: true,
    data: newMember,
  });
};

export const updateMember: RequestHandler = (req, res) => {
  const { id } = req.params;
  const member = mockMembers.find((m) => m.id === id);

  if (!member) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  Object.assign(member, req.body);

  res.status(200).json({
    success: true,
    data: member,
  });
};

export const deleteMember: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = mockMembers.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  const deletedMember = mockMembers.splice(index, 1);

  res.status(200).json({
    success: true,
    data: deletedMember[0],
  });
};

export const addPoints: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { points } = req.body;

  const member = mockMembers.find((m) => m.id === id);

  if (!member) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  member.loyaltyPoints += points;

  res.status(200).json({
    success: true,
    data: member,
  });
};
