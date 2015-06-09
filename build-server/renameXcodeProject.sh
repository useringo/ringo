#!/bin/sh

################################################################################
#
# renameXcodeProject.sh
#
# author: Monte Ohrt <monte@ohrt.com>
# date: Jan 27, 2009
# version: 1.0
#
# This script will copy an xcode project to a new project directory name
# and replace/rename all files within to work as expected under the new name.
# Project names that contain characters other than alpha-numeric, spaces or
# underscores MAY not work properly with this script. Use at your own risk!
# Be CERTAIN to backup your project(s) before renaming.
#
# One simple rule:
# 
# 1) The old project name cannot contain the new project name, so for instance,
#    renaming "MyStuff" to "MyStuff2" will not work. If you really need to do
#    this, rename the project to a temp name, then rename again.
#
# I also have instructions for manually renaming an xcode project here:
#
# http://mohrt.blogspot.com/2008/12/renaming-xcode-project.html
#
#
# Installation:
#
# Copy (this) file "renameXcodeProject.sh" to your file system, and invoke:
#
#   chmod 755 renameXcodeProject.sh
#
# to make it executable.
#
# usage:
#
#   renameXcodeProject.sh <OldProjectName> <NewProjectName>
#
# examples:
#
#   ./renameXcodeProject.sh OldName NewName
#   ./renameXcodeProject.sh "Old Name" "New Name"
#
################################################################################

OLDNAME=$1
NEWNAME=$2

# remove bad characters
OLDNAME=`echo "${OLDNAME}" | sed -e "s/[^a-zA-Z0-9_ -]//g"`
NEWNAME=`echo "${NEWNAME}" | sed -e "s/[^a-zA-Z0-9_ -]//g"`

TMPFILE=/tmp/xcodeRename.$$

if [ "$OLDNAME" = "" -o "$NEWNAME" = "" ]; then
  echo "usage: $0 <OldProjectName> <NewProjectName>"
  exit
fi

echo "${NEWNAME}" | grep "${OLDNAME}" > /dev/null
if [ $? -eq 0 ]; then
  echo "Error: New project name cannot contain old project name. Use a tmp name first. Terminating."
  exit
fi

if [ ! -d "${OLDNAME}" ]; then
  echo "ERROR: \"${OLDNAME}\" must be a directory"
  exit
fi 

# set new project directory
if [ -d "${NEWNAME}" ]; then
  echo "ERROR: project directory \"${NEWNAME}\" exists. Terminating."
  exit
fi

# be sure tmp file is writable
cp /dev/null ${TMPFILE}
if [ $? -ne 0 ]; then
  echo "tmp file ${TMPFILE} is not writable. Terminating."
  exit
fi

# create project name with unscores for spaces
OLDNAMEUSCORE=`echo "${OLDNAME}" | sed -e "s/ /_/g"`
NEWNAMEUSCORE=`echo "${NEWNAME}" | sed -e "s/ /_/g"`

# copy project directory
echo copying project directory from "${OLDNAME}" to "${NEWNAME}"
cp -rp "${OLDNAME}" "${NEWNAME}"

# remove build directory
echo removing build directory from "${NEWNAME}"
rm -rf "${NEWNAME}/build"

#find text files, replace text
find "${NEWNAME}/." | while read currFile
do
  # find files that are of type text
  file "${currFile}" | grep "text" > /dev/null
  if [ $? -eq 0 ]; then
    # see if old proj name with underscores is in the text
    grep "${OLDNAMEUSCORE}" "${currFile}" > /dev/null
    if [ $? -eq 0 ]; then
       # replace the text with new proj name
       echo found "${OLDNAMEUSCORE}" in "${currFile}", replacing...
       sed -e "s/${OLDNAMEUSCORE}/${NEWNAMEUSCORE}/g" "${currFile}" > ${TMPFILE}
       mv ${TMPFILE} "${currFile}"              
       cp /dev/null ${TMPFILE}
    fi
    # see if old proj name is in the text
    grep "${OLDNAME}" "${currFile}" > /dev/null
    if [ $? -eq 0 ]; then
       # replace the text with new proj name
       echo found "${OLDNAME}" in "${currFile}", replacing...
       sed -e "s/${OLDNAME}/${NEWNAME}/g" "${currFile}" > ${TMPFILE}
       mv ${TMPFILE} "${currFile}"              
       cp /dev/null ${TMPFILE}
    fi
  fi
done

# rename directories with underscores
find "${NEWNAME}/." -type dir | while read currFile
do
  echo "${currFile}" | grep "${OLDNAMEUSCORE}" > /dev/null
  if [ $? -eq 0 ]; then
    MOVETO=`echo "${currFile}" | sed -e "s/${OLDNAMEUSCORE}/${NEWNAMEUSCORE}/g"`
    echo renaming "${currFile}" to "${MOVETO}"
    mv "${currFile}" "${MOVETO}"
  fi
done

# rename directories with spaces
find "${NEWNAME}/." -type dir | while read currFile
do
  echo "${currFile}" | grep "${OLDNAME}" > /dev/null
  if [ $? -eq 0 ]; then
    MOVETO=`echo "${currFile}" | sed -e "s/${OLDNAME}/${NEWNAME}/g"`
    echo renaming "${currFile}" to "${MOVETO}"
    mv "${currFile}" "${MOVETO}"
  fi
done

# rename files with underscores
find "${NEWNAME}/." -type file | while read currFile
do
  echo "${currFile}" | grep "${OLDNAMEUSCORE}" > /dev/null
  if [ $? -eq 0 ]; then
    MOVETO=`echo "${currFile}" | sed -e "s/${OLDNAMEUSCORE}/${NEWNAMEUSCORE}/g"`
    echo renaming "${currFile}" to "${MOVETO}"
    mv "${currFile}" "${MOVETO}"
  fi
done

# rename files with spaces
find "${NEWNAME}/." -type file | while read currFile
do
  echo "${currFile}" | grep "${OLDNAME}" > /dev/null
  if [ $? -eq 0 ]; then
    MOVETO=`echo "${currFile}" | sed -e "s/${OLDNAME}/${NEWNAME}/g"`
    echo renaming "${currFile}" to "${MOVETO}"
    mv "${currFile}" "${MOVETO}"
  fi
done

rm -f ${TMPFILE}

echo finished.
