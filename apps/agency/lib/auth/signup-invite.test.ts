import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSignupInviteValid, isSignupOpen } from "./signup-invite";

describe("signup invite", () => {
  it("fails closed when no code is configured", () => {
    assert.equal(isSignupInviteValid("anything", undefined), false);
    assert.equal(isSignupInviteValid("anything", "   "), false);
    assert.equal(isSignupOpen(undefined), false);
  });

  it("rejects empty and wrong codes", () => {
    assert.equal(isSignupInviteValid("", "secret-code"), false);
    assert.equal(isSignupInviteValid("secret-cod", "secret-code"), false);
    assert.equal(isSignupInviteValid("SECRET-CODE", "secret-code"), false);
  });

  it("accepts the right code, ignoring surrounding whitespace", () => {
    assert.equal(isSignupInviteValid(" secret-code ", "secret-code"), true);
    assert.equal(isSignupOpen("secret-code"), true);
  });
});
