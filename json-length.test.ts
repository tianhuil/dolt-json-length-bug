import { test, expect, describe, beforeAll } from "bun:test";
import mysql from "mysql2/promise";

const DOLT_HOST = process.env.DOLT_HOST ?? "127.0.0.1";
const DOLT_PORT = Number(process.env.DOLT_PORT ?? 3306);
const DOLT_USER = process.env.DOLT_USER ?? "root";
const DOLT_PASS = process.env.DOLT_PASS ?? "";

let sharedConn: mysql.Connection;

beforeAll(async () => {
  sharedConn = await mysql.createConnection({
    host: DOLT_HOST,
    port: DOLT_PORT,
    user: DOLT_USER,
    password: DOLT_PASS,
  });
});

describe("JSON_LENGTH on Dolt", () => {
  test("JSON_LENGTH('[]') returns NULL — BUG: should be 0 per MySQL spec", async () => {
    const [rows] = await sharedConn.execute("SELECT JSON_LENGTH('[]') AS len");
    const row = (rows as Record<string, unknown>[])[0];
    expect(row["len"]).toBeNull();
  });

  test("JSON_LENGTH('{}') returns NULL — BUG: should be 0 per MySQL spec", async () => {
    const [rows] = await sharedConn.execute("SELECT JSON_LENGTH('{}') AS len");
    const row = (rows as Record<string, unknown>[])[0];
    expect(row["len"]).toBeNull();
  });

  test("JSON_LENGTH('[1,2,3]') returns 3 (correct)", async () => {
    const [rows] = await sharedConn.execute("SELECT JSON_LENGTH('[1,2,3]') AS len");
    const row = (rows as Record<string, unknown>[])[0];
    expect(row["len"]).toBe(3);
  });

  test("JSON_LENGTH('\"string\"') returns 1 per MySQL spec", async () => {
    const [rows] = await sharedConn.execute('SELECT JSON_LENGTH(\'"string"\') AS len');
    const row = (rows as Record<string, unknown>[])[0];
    expect(row["len"]).toBe(1);
  });

  test("JSON_LENGTH(NULL) returns NULL (correct, per MySQL spec)", async () => {
    const [rows] = await sharedConn.execute("SELECT JSON_LENGTH(NULL) AS len");
    const row = (rows as Record<string, unknown>[])[0];
    expect(row["len"]).toBeNull();
  });

  test("JSON_LENGTH on table column: empty array returns NULL — BUG", async () => {
    await sharedConn.execute(
      "CREATE TABLE IF NOT EXISTS test_json_length_bug (id INT PRIMARY KEY, arr JSON)"
    );
    await sharedConn.execute(
      "INSERT INTO test_json_length_bug (id, arr) VALUES (1, '[]'), (2, '[1,2]') ON DUPLICATE KEY UPDATE arr=VALUES(arr)"
    );
    const [rows] = await sharedConn.execute(
      "SELECT id, JSON_LENGTH(arr) AS len FROM test_json_length_bug ORDER BY id"
    );
    const r = rows as { id: number; len: number | null }[];
    expect(r[0].len).toBeNull();
    expect(r[1].len).toBe(2);
  });
});
