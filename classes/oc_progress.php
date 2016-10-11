<?php

function getOCProgress($courseId, $sectionId) {
    global $DB, $CFG, $USER;
    require_once($CFG->libdir . '/gradelib.php');
    $percentage = 0;

    if (!$module = $DB->get_record('modules', array('name' => 'hvp'))) {
        return false;
    }

    $cm = $DB->get_records('course_modules', array('section' => $sectionId, 'course' => $courseId, 'module' => $module->id));
    $count = count($cm);

    if ($count == 0) {
        return false;
    }

    foreach ($cm as $module) {
        $grading_info = grade_get_grades($module->course, 'mod', 'hvp', $module->instance, $USER->id);
        $user_grade = $grading_info->items[0]->grades[$USER->id]->grade;

        $percentage += $user_grade / $count;
    }

    $progress = array('sectionId' => $sectionId, 'percentage' => $percentage);

    return $progress;
}