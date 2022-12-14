import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import LevelSelect from "./Components/LevelSelect";
import { getAllLevels, InsertLevel } from "../../Database/database";
import { useAuth } from "../../Context/AdminContext";
import { emptyLevel, LevelType } from "../../Types/Types";
import LevelNumberInput from "./Components/LevelNumberInput";
import PositionButton from "./Components/PositionButton";
import { TOGGLES } from "../../Utils/constants";
import MapRow from "./Components/MapRow";
import Loader from "../../Components/Loader";
import Alerts from "../../Components/Alerts";
import { AlertType } from "../../Types/Types";

type Props = {
  setRefreshKey: () => void;
};

const Levels: React.FC<Props> = ({ setRefreshKey }) => {
  const auth = useAuth();
  const [isLoader, setIsLoader] = useState(false);
  const [levelObject, setLevelObject] = useState<LevelType>(emptyLevel);
  const [allLevels, setAllLevels] = useState();
  const [levelCode, setLevelCode] = useState();
  const [levelSize, setLevelSize] = useState({ x: 8, y: 4 });
  const [numberOfEnemies, setNumberOfEnemies] = useState(1);
  const [alertSettings, setAlertSettings] = useState<AlertType>({
    isOpen: false,
    type: "error",
    message: "Wrong Login Credentials...",
  });
  const [toggles, setToggles] = useState([false, false, false, false, false]);
  useEffect(() => {
    const getLevels = async () => {
      setIsLoader(true);
      const levels = await getAllLevels(auth?.token!);
      setAllLevels(levels);
      let newLevelCode = levels.length + 1;
      setLevelCode(newLevelCode);
      setLevelObject({ ...levelObject, code: newLevelCode });
      setIsLoader(false);
    };
    getLevels();
  }, []);

  useEffect(() => {
    //סגירת כל הטוגלים
    handleToggles();

    const newMap = JSON.parse(JSON.stringify(levelObject.map));
    const rowDiff = levelSize.y - levelObject.map.length;
    const cellDiff = levelSize.x - levelObject.map[0].length;
    if (rowDiff > 0 || cellDiff > 0) {
      for (let i = 0; i < rowDiff; i++) {
        newMap.push([...Array(levelSize.x).fill(0)]);
      }
      for (let row of newMap) {
        for (let i = 0; i < cellDiff; i++) {
          row.push(0);
        }
      }
    } else if (rowDiff < 0 || cellDiff < 0) {
      for (let i = 0; i < Math.abs(rowDiff); i++) {
        newMap.pop();
      }
      for (let row of newMap) {
        for (let i = 0; i < Math.abs(cellDiff); i++) {
          row.pop();
        }
      }
    }
    setLevelObject({ ...levelObject, map: newMap });
  }, [levelSize]);

  useEffect(() => {
    //סגירת כל הטוגלים
    handleToggles();
    const enemiesDiff = numberOfEnemies - levelObject.enemies.length;
    if (enemiesDiff > 0) {
      for (let i = 0; i < enemiesDiff; i++) {
        levelObject.enemies.push({
          code: i + 1,
          start_position: [-1, -1],
          startDirection: "RIGHT",
        });
      }
    } else if (enemiesDiff < 0) {
      for (let i = 0; i < Math.abs(enemiesDiff); i++) {
        levelObject.enemies.pop();
      }
    }
  }, [numberOfEnemies]);

  const handleToggles = (index = -1) => {
    let updated = toggles.map((val, i) => {
      if (index === i) return !val;
      return false;
    });
    setToggles(updated);
  };
  const handleStepCapChange = (val: string, id: string) => {
    const index = parseInt(id[1]);
    const steps = levelObject.step_cap;
    steps[index].step = parseInt(val);
    steps[index].code = index === 0 ? 3 : 2;
    setLevelObject({ ...levelObject, step_cap: [...steps] });
  };

  const handleSubmit = async () => {
    handleToggles();
    setIsLoader(true);
    const enemies = levelObject.enemies;
    const player = levelObject.player.start_position;
    //check if enemy is not in [-1,-1]
    const isInvalidEnemy = enemies.some(
      (enemy) => enemy.start_position[0] === -1 && enemy.start_position[1] === -1
    );
    //set exit index
    const endY = levelObject.end_point[0];
    const endX = levelObject.end_point[1];
    const map = JSON.parse(JSON.stringify(levelObject.map));
    map[endY][endX] = -1;
    //check user position from enemy
    const isCollides = enemies.some(
      (enemy) =>
        (enemy.start_position[0] === player[0] + 1 && enemy.start_position[1] === player[1]) ||
        (enemy.start_position[1] === player[1] + 1 && enemy.start_position[0] === player[0]) ||
        (enemy.start_position[0] === player[0] - 1 && enemy.start_position[1] === player[1]) ||
        (enemy.start_position[1] === player[1] - 1 && enemy.start_position[0] === player[0])
    );
    if (!isInvalidEnemy && !isCollides) {
      const data = { ...levelObject, map };
      setLevelObject(data);
      const levelAdded = await InsertLevel(auth?.token!, data);
      setAlertSettings({
        isOpen: true,
        type: "success",
        message: "Level added successfully!",
      });
      setTimeout(() => {
        setRefreshKey();
      }, 2000);
    } else {
      setAlertSettings({
        isOpen: true,
        type: "error",
        message: "Error while adding level, please check you fields and try again!",
      });
    }
    setIsLoader(false);
  };

  return (
    <>
      <Loader isLoader={isLoader} />
      <Alerts settings={alertSettings} setSettings={(val) => setAlertSettings(val)} />

      <Box>
        <div
          style={{
            height: "calc(100vh - 231px)",
            display: "grid",
            gridTemplateRows: "2fr auto 5fr auto 2fr auto",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Box>
            <Typography>Settings</Typography>
            <Paper>
              <Box
                p={1}
                display={"flex"}
                alignItems="center"
                flexWrap={"wrap"}
                justifyContent={"space-around"}
              >
                <Box>
                  <Typography variant="subtitle2">Level Code</Typography>
                  <Typography variant="h6">{levelCode}</Typography>
                </Box>

                <LevelSelect
                  name={"Rows"}
                  value={levelSize.y}
                  options={[4, 5, 6]}
                  changeHandler={(val) => setLevelSize({ ...levelSize, y: val as number })}
                />
                <LevelSelect
                  name={"Cols"}
                  value={levelSize.x}
                  options={[8, 9, 10, 11, 12, 13]}
                  changeHandler={(val) => setLevelSize({ ...levelSize, x: val as number })}
                />
                <LevelSelect
                  name={"Difficulty"}
                  value={levelObject.difficulty}
                  options={[1, 2, 3]}
                  changeHandler={(val) =>
                    setLevelObject({ ...levelObject, difficulty: val as number })
                  }
                />

                <LevelSelect
                  name={"Enemies"}
                  value={numberOfEnemies}
                  options={[1, 2, 3]}
                  changeHandler={(val) => setNumberOfEnemies(val as number)}
                />
                <LevelNumberInput
                  id={"s0"}
                  name={"★ ★ ★"}
                  label={"number"}
                  // min = {levelObject.step_cap[0].step}
                  changeHandler={(val, id) => handleStepCapChange(val, id)}
                  value={levelObject.step_cap[0].step}
                />
                <LevelNumberInput
                  id={"s1"}
                  name={"★ ★ "}
                  label={"number"}
                  min={levelObject.step_cap[0].step + 1}
                  changeHandler={(val, id) => handleStepCapChange(val, id)}
                  value={levelObject.step_cap[1].step}
                />
              </Box>
            </Paper>
          </Box>
          <Divider />

          <Box>
            {levelObject.map.map((row, index) => {
              return (
                <MapRow
                  key={index}
                  index={index}
                  row={row}
                  toggles={toggles}
                  levelObject={levelObject}
                  setLevelObject={(obj: LevelType) => setLevelObject(obj)}
                />
              );
            })}
          </Box>

          <Divider />

          <Box>
            <Typography>Positions</Typography>
            <Paper>
              <Box
                p={1}
                display={"flex"}
                alignItems="center"
                flexWrap={"wrap"}
                justifyContent={"space-around"}
              >
                <PositionButton
                  label="Player"
                  isPressed={toggles[TOGGLES.PLAYER]}
                  setIsPressed={() => handleToggles(TOGGLES.PLAYER)}
                />

                <PositionButton
                  label="Exit"
                  isPressed={toggles[TOGGLES.EXIT]}
                  setIsPressed={() => handleToggles(TOGGLES.EXIT)}
                />

                <PositionButton
                  label="Enemy 1"
                  isPressed={toggles[TOGGLES.ENEMY1]}
                  setIsPressed={() => handleToggles(TOGGLES.ENEMY1)}
                />
                <PositionButton
                  label="Enemy 2"
                  isPressed={toggles[TOGGLES.ENEMY2]}
                  isDisabled={numberOfEnemies < 2}
                  setIsPressed={() => handleToggles(TOGGLES.ENEMY2)}
                />
                <PositionButton
                  label="Enemy 3"
                  isPressed={toggles[TOGGLES.ENEMY3]}
                  isDisabled={numberOfEnemies < 3}
                  setIsPressed={() => handleToggles(TOGGLES.ENEMY3)}
                />
              </Box>
            </Paper>
          </Box>

          <Box textAlign={"center"} marginTop={1}>
            <Button onClick={handleSubmit} variant="contained">
              Create Level
            </Button>
          </Box>
        </div>
      </Box>
    </>
  );
};

export default Levels;
