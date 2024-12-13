@echo off
set /p snapshotName=Enter snapshot name:
git add .
git commit -m "Snapshot: %snapshotName%"
git tag %snapshotName%
echo Snapshot '%snapshotName%' created.
