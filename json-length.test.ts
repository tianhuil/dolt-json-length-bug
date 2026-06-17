import { test, expect, describe } from "bun:test";
import mysql from "mysql2/promise";

const DOLT_HOST = process.env.DOLT_HOST ?? "127.0.0.1";
const DOLT_PORT = Number(process.env.DOLT_PORT ?? 3306);
const DOLT_USER = process.env.DOLT_USER ?? "root";
const DOLT_PASS = process.env.DOLT_PASS ?? "";

async function queryOne(sql: string) {
  const conn = await mysql.createConnection({
    host: DOLT_HOST,
    port: DOLT_PORT,
    user: DOLT_USER,
    password: DOLT_PASS,
  });
  try {
    const [rows] = await conn.execute(sql);
    return (rows as Record<string, unknown>[])[0];
  } finally {
    await conn.end();
  }
}

describe("JSON_LENGTH regression", () => {
  test("JSON_LENGTH('[]') should return 0, not NULL", async () => {
    const row = await queryOne("SELECT JSON_LENGTH('[]') AS len");
    expect(row["len"]).toBe(0);
  });

  test("JSON_LENGTH('{}') should return 0, not NULL", async () => {
    const row = await queryOne("SELECT JSON_LENGTH('{}') AS len");
    expect(row["len"]).toBe(0);
  });

  test("JSON_LENGTH('[1,2,3]') returns correct count", async () => {
    const row = await queryOne("SELECT JSON_LENGTH('[1,2,3]') AS len");
    expect(row["len"]).toBe(3);
  });

  test("JSON_LENGTH('null') returns NULL per MySQL spec", async () => {
    const row = await queryOne("SELECT JSON_LENGTH(null) AS len");
    expect(row["len"]).toBeNull();
  });

  test("JSON_LENGTH(NULL) returns NULL per MySQL spec", async () => {
    const row = await queryOne("SELECT JSON_LENGTH(NULL) AS len");
    expect(row["len"]).toBeNull();
  });

  test("JSON_LENGTH on table column also fails", async () => {
    const conn = await mysql.createConnection({
      host: DOLT_HOST,
      port: DOLT_PORT,
      user: DOLT_USER,
      password: DOLT_PASS,
    });
    try {
      await conn.execute(
        "CREATE TABLE IF NOT EXISTS test_json_length_bug (id INT PRIMARY KEY, arr JSON)"
      );
      await conn.execute(
        "INSERT INTO test_json_length_bug (id, arr) VALUES (1, '[]'), (2, '[1,2]') ON DUPLICATE KEY UPDATE arr=VALUES(arr)"
      );
      const [rows] = await conn.execute(
        "SELECT id, JSON_LENGTH(arr) AS len FROM test_json_length_bug ORDER BY id"
      );
      const r = rows as { id: number; len: number }[];
      expect(r[0].len).toBe(0);
      expect(r[1].len).toBe(2);
    } finally {
      await conn.end();
    }
  });
});
