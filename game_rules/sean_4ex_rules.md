# Sean 4EX Game Rules

## Overview

A turn-based 4X strategy game for 2-4 players (expandable to more). This is a minimized version of civilization where players lead tribes, manage resources, and compete for dominance.

## Table of Contents

- [Game Objective](#game-objective)
- [Initial Setup](#initial-setup)
- [Resources](#resources)
- [Population Types](#population-types)
- [Turn Structure](#turn-structure)
  - [Phase 1: Assign Jobs](#phase-1-assign-jobs)
  - [Phase 2: Execution](#phase-2-execution)
  - [Phase 3: End Turn](#phase-3-end-turn)
- [Combat System](#combat-system)
- [Victory Conditions](#victory-conditions)

---

## Game Objective

Lead your tribe to prosperity by managing population, gathering resources, crafting items, and conquering rivals. Win by growing your population to twice that of all other players combined.

---

## Initial Setup

Each player starts with:
- **5 free population units**
- **10 food**

---

## Resources

### Raw Materials

| Resource | Gathered By | Uses |
|----------|-------------|------|
| **Food** | Gatherers | Feed population, send troops |
| **Stone** | Gatherers | Craft tools and weapons |
| **Leather** | Gatherers | Craft armor and tools |
| **Stick** | Gatherers | Craft tools and weapons |

### Crafted Items

See [Item Crafting Table](#item-crafting-table) for details.

---

## Population Types

| Type | Role | Notes |
|------|------|-------|
| **Free Population** | Unassigned units | Can be assigned to any role |
| **Gatherer** | Produces raw materials | Food, stone, leather, or stick |
| **Crafter** | Creates tools and weapons | Requires raw materials |
| **Fighter** | Attacks or defends | Levels 1-5, can train or raid |
| **Wounded Fighter** | Recovering from battle | Cannot work, recovers after 1-3 turns |

---

## Turn Structure

Each turn consists of three phases: **Assign Jobs**, **Execution**, and **End Turn**.

### Phase 1: Assign Jobs

Players assign their free population and manage existing roles.

#### Assigning Gatherers
- Choose resource type: **Food**, **Stone**, **Leather**, or **Stick**
- Can equip with [gathering tools](#tool-assignments)

#### Assigning Crafters
- Select item to craft (requires raw materials)
- Raw materials are deducted immediately upon assignment
- Can equip with [crafting tools](#tool-assignments)
- See [Item Crafting Table](#item-crafting-table)

#### Assigning Fighters
Fighters can either:

**Option A: Train**
- Gain +1 level per turn (max level 5)

**Option B: March to Raid**
- Select target player
- Choose battle strategy:
  - **Fight to the last**: Never retreat
  - **Retreat when weaker**: Withdraw if [Combat Power](#combat-power-calculation) falls below defender's
- **Cost**: 4 food per fighter (deducted immediately)
- **Travel time**: 1 turn to arrive, 1 turn to return

#### Releasing Units
- Any gatherer, crafter, or available fighter can be released to free population
- ⚠️ **Warning**: Fighters lose all levels when released, but will return assigned weapon and armor back to stash

#### Tool Assignments
- Tools and equipment can be freely assigned/unassigned to available units
- See [Tool Types](#tool-types) for assignment rules

---

### Phase 2: Execution

Production and combat resolution happen automatically.

#### Gatherer Production

**Grouping Rules:**
Gatherers are grouped by:
1. Resource type (food/stone/leather/stick)
2. Tool status (with/without tool)

**Example:**
- Gatherers A, B: gather food (A, B have tools)
- Gatherers C, D, E, F: gather stone (only C has tool)

**Groups formed:**
- Group 1: [A, B] - food with tools
- Group 2: [C] - stone with tools  
- Group 3: [D, E, F] - stone without tools

**Production Formula:**

```
Production Score = floor(N × Tool Multiplier)

Where:
  N = number of gatherers in group
  Tool Multiplier = 1.5 (with tool) or 1 (without tool)
  floor() = round down to nearest integer
```

**Resource Conversion:**
- **1 score** = **2 food** OR **1 stone/leather/stick**

**Example Calculations:**

| Group | People | Tool? | Score Calculation | Score | Output |
|-------|--------|-------|-------------------|-------|--------|
| Food + tools | 2 | Yes | 2 × 1.5 | 3 | 6 food or 3 other |
| Stone + tools | 1 | Yes | 1 × 1.5 | 1.5 → 1 | 1 stone |
| Stone, no tools | 3 | No | 3 × 1 | 3 | 3 stone |

#### Crafter Production

**Grouping Rules:**
Same as gatherers - grouped by item type and tool status.

**Crafting Formula:**

```
Crafting Score = floor(N × Tool Multiplier)

Where:
  N = number of crafters in group
  Tool Multiplier = 1.5 (with tool) or 1 (without tool)
  floor() = round down to nearest integer
```

#### Item Crafting Table

| Item | Materials Required | Crafting Score | Can Be Used By |
|------|-------------------|----------------|----------------|
| **Gathering Tool** | 1 leather + 1 stick | 1 | Gatherers |
| **Crafting Tool** | 2 stones + 1 stick | 1 | Crafters |
| **Universal Tool** | 2 stones + 1 leather + 1 stick | 1 | Gatherers or Crafters |
| **Sharpened Stone** | 1 stone | 1 | (Component for weapons) |
| **Spear** | 1 sharpened stone + 1 stick | 1 | Fighters (melee) |
| **Bow** | 1 sharpened stone + 1 leather + 2 sticks | 1 | Fighters (ranged) |
| **Armor** | 2 leathers | 1 | Any fighter |

#### Tool Types

- **Gathering Tool**: Can only be assigned to gatherers
- **Crafting Tool**: Can only be assigned to crafters  
- **Universal Tool**: Can be assigned to gatherers OR crafters

#### Fighter Actions

| Status | Action | Effect |
|--------|--------|--------|
| **Training** | Gain experience | +1 level per turn (max 5) |
| **Marching** | Travel to target | Takes 1 turn to arrive |
| **In Combat** | Fighting | See [Combat System](#combat-system) |
| **Retreating** | Return home | Takes 1 turn to return |

---

### Phase 3: End Turn

Resources and population are finalized.

#### 1. Add Production to Stash
- All gathered resources and crafted items are added
- **No storage limit**

#### 2. Process Returning Troops
- Add looted resources to stash
- Calculate [wounded fighters](#wounded-fighter-recovery)

#### 3. Population Adjustment

**Step 1: Feed Population**

```
X = Current population at base (excludes troops still away)
Y = Remaining food in stash

Deduct X food from Y (each person eats 1 food)
```

**Step 2: Population Change**

If **Y ≥ 0** (food surplus):
```
New births = floor(Y / 3)
Add to free population
```

If **Y < 0** (food shortage):
```
Deaths = abs(floor(Y / 3))
Randomly remove that many population units
```

> **Note**: "floor" means round down to nearest integer
> - Example: floor(10/3) = floor(3.33) = 3
> - Example: floor(-8/3) = floor(-2.67) = -2, so abs(-2) = 2 deaths

**Example Scenarios:**

| Scenario | Population (X) | Food (Y) | After Feeding | Result |
|----------|----------------|----------|---------------|--------|
| Abundant | 10 | 25 | 15 | +5 free population (floor(15/3)) |
| Sufficient | 10 | 10 | 0 | No change |
| Shortage | 10 | 5 | -5 | 1 random death (abs(floor(-5/3))) |

---

## Combat System

Combat occurs when attacking troops arrive at a defender's base.

### Combatant Setup

**Attacker Side:**
- All troops that marched to raid

**Defender Side:**
- All fighters at base (including those training)

### Fighter Types

| Type | Weapon | Special Ability |
|------|--------|-----------------|
| **Warrior** | Bare fists | Basic melee |
| **Spearman** | Spear | Enhanced melee damage |
| **Archer** | Bow | Ranged attacks in first 2 rounds |

### Fighter Statistics

#### Health Points (HP)

```
Initial HP = 100 × (level × 0.2 + 1)
```

| Level | HP |
|-------|----|
| 1 | 120 |
| 2 | 140 |
| 3 | 160 |
| 4 | 180 |
| 5 | 200 |

#### Damage

**Base Stats:**
- Base Damage: 20

**Equipment Bonuses:**

| Equipment | Effect |
|-----------|--------|
| **Spear** | +15 damage |
| **Bow** | +0 damage, ranged attacks in first 2 rounds |
| **Armor** | Reduces incoming damage by 30% (see below) |

**Armor Mechanic:**
When a fighter with armor is assigned damage:
```
Actual damage taken = floor(assigned_damage × 0.7)

Example:
- Fighter assigned 20 damage
- With armor: floor(20 × 0.7) = floor(14) = 14 damage taken
- Without armor: 20 damage taken
```

### Battle Flow

Each battle lasts **5 rounds** per turn.

#### Round Sequence

| Rounds | Who Can Attack |
|--------|----------------|
| 1-2 | **Archers only** |
| 3-5 | **Everyone** |

#### Round Resolution

**Step 1: Collect All Attacks**
```
Create a list of all attacks from both sides:
  - Each fighter generates one attack with their damage value
  - Attacks are collected in random order
```

**Step 2: Resolve Attacks One by One**
For each attack in the list:
1. Select a random living enemy fighter as the target
2. Calculate damage:
   - If target has armor: `actual_damage = floor(attack_damage × 0.7)`
   - If no armor: `actual_damage = attack_damage`
3. Apply damage to target
4. If target HP ≤ 0, mark target as dead (will be removed after all attacks resolve)
5. Proceed to next attack

**Important:** All attacks in the round execute even if the attacker dies during the round. Think of it as both sides firing simultaneously, then casualties are removed after all attacks are resolved.

**Step 3: Continue or End**
- If both sides have survivors, continue to next round
- After 5 rounds, evaluate [battle outcome](#battle-outcomes)

**Example Round:**
```
Side A: 2 archers (20 damage each, 50 HP each)
Side B: 2 spearmen (35 damage each, 60 HP and 40 HP)

Attack sequence (randomized):
1. Spearman 1 attacks → random target: Archer 1
   → 35 damage → Archer 1: 15 HP
2. Archer 1 attacks → random target: Spearman 2
   → 20 damage → Spearman 2: 20 HP
3. Spearman 2 attacks → random target: Archer 1
   → 35 damage → Archer 1: -20 HP (marked as dead)
4. Archer 2 attacks → random target: Spearman 2
   → 20 damage → Spearman 2: 0 HP (marked as dead)

After all attacks resolve:
  - Archer 1 is removed (died in step 3)
  - Spearman 2 is removed (died in step 4)
  - Archer 1's attack (step 2) still counted even though he died later
  - Spearman 2's attack (step 3) still counted even though he died later

Survivors: Archer 2 (50 HP), Spearman 1 (60 HP)
```

### Battle Outcomes

After each set of 5 rounds:

#### Outcome A: Attacker Eliminated
- Battle ends
- Surviving defenders become [wounded fighters](#wounded-fighter-recovery)

#### Outcome B: Attacker Retreats

Occurs when:
1. Attacker has lower [Combat Power](#combat-power-calculation) than defender
2. Attacker chose "retreat when weaker" strategy

**Result:**
- Attacker retreats (takes 1 turn to return home)
- Battle ends

#### Outcome C: Defender Eliminated

**Result:**
- Attacker loots **all** raw materials and items
- Defender's current turn production reduced by half (rounded down)
- Attacker retreats with loot (takes 1 turn to return)

**Example:**
- Defender was producing 3 food + 1 stone
- After raid: produces 1 food + 0 stone this turn

#### Outcome D: Battle Continues

If neither side is eliminated and attacker doesn't retreat:
- Battle continues in next turn
- New reinforcements join:
  - Defender: newly trained fighters
  - Attacker: new raiding troops (can override retreat strategy)
- Another 5 rounds begin

### Combat Power Calculation

Used to determine if attackers should retreat:

```
Combat Power = Sum of all fighters' power

Each fighter's power = damage × effective_HP × multiplier

Where:
  damage = fighter's damage stat
  effective_HP = remaining_HP × 1.5 (if wearing armor) or remaining_HP (if not)
  multiplier = 1.5 (for archers) or 1.0 (for others)
```

**Example:**
```
Level 3 Spearman with 100 HP remaining and armor:
  damage = 35 (20 base + 15 from spear)
  effective_HP = 100 × 1.5 = 150
  multiplier = 1.0
  power = 35 × 150 × 1.0 = 5,250

Level 3 Archer with 100 HP remaining, no armor:
  damage = 20 (20 base + 0 from bow)
  effective_HP = 100 × 1.0 = 100
  multiplier = 1.5
  power = 20 × 100 × 1.5 = 3,000
```

### Battle Example Timeline

| Turn | Event |
|------|-------|
| N | Player A sends troops to raid Player B with "retreat when weaker" |
| N+1 | Troops marching |
| N+2 | Battle begins, 5 rounds fought, both sides survive, attacker stronger |
| N+3 | Battle continues, 5 more rounds, attacker now weaker → **retreats** |
| N+4 | Troops return home |

### Wounded Fighter Recovery

After battle ends, for each surviving fighter:

| Remaining HP | Status | Recovery Time |
|--------------|--------|---------------|
| **> 75%** | Immediately recover to full HP | 0 turns |
| **51-75%** | Becomes wounded | 1 turn |
| **26-50%** | Becomes wounded | 2 turns |
| **≤ 25%** | Becomes wounded | 3 turns |

**Wounded fighters:**
- Cannot perform any actions
- Recover to full HP with same level and equipment after recovery time

### Post-Battle Bonuses

Each surviving fighter receives:
- **+1 level** (unless already max level 5)
- **+20 HP recovered**

---

## Victory Conditions

### Winning the Game

The game ends immediately when a player meets **BOTH** conditions:

```
1. Total population > 1.5 × (sum of all other players' populations)
AND
2. Lead by at least 10 population over the highest other player
```

**That player is declared the winner.**

**Example 1 - Not enough lead:**
- Player A: 22 population
- Player B: 10 population  
- Player C: 5 population
- Check 1: 22 > 1.5 × (10 + 5) = 22 > 22.5 ❌
- Player A does NOT win

**Example 2 - Meets ratio but not lead:**
- Player A: 25 population
- Player B: 12 population
- Player C: 5 population
- Check 1: 25 > 1.5 × (12 + 5) = 25 > 25.5 ❌
- Player A does NOT win

**Example 3 - Victory:**
- Player A: 30 population
- Player B: 10 population
- Player C: 5 population  
- Check 1: 30 > 1.5 × (10 + 5) = 30 > 22.5 ✓
- Check 2: 30 - 10 = 20 lead ≥ 10 ✓
- **Player A wins!**

### Surrendering

- Any player can surrender at any time
- Surrendered/disconnected players are removed from the game
- Their resources are lost (not distributed)

---

## Quick Reference

### Key Formulas

| Calculation | Formula |
|-------------|---------|
| **Production/Crafting Score** | floor(N × Tool Multiplier) |
| **Tool Multiplier** | 1.5 with tool, 1 without |
| **Fighter HP** | 100 × (level × 0.2 + 1) |
| **Armor Effect** | Actual damage = floor(assigned_damage × 0.7) |
| **Combat Power** | damage × effective_HP × multiplier |
| **Effective HP** | HP × 1.5 (with armor) or HP × 1.0 (without armor) |
| **Combat Power Multiplier** | 1.5 for archers, 1.0 for melee |
| **Population Change** | floor(remaining_food / 3) |
| **Raid Food Cost** | 4 food per fighter |

### Important Notes

- Troops outside base don't count for food consumption until they return
- Wounded fighters DO count for food consumption
- There is no storage limit for resources and items
- Fighter levels are permanent (until released to free population)
- Equipment can be reassigned freely during Assign Jobs phase
