const express = require('express');
const router = express.Router();

const authRouter = require('./admin/auth');
const usersRouter = require('./admin/users');
const employeesRouter = require('./admin/employees');
const sectionsRouter = require('./admin/sections');
const customFieldsRouter = require('./admin/customfields');
const profileSectionsRouter = require('./admin/profilesections');
const sectionFieldsRouter = require('./admin/sectionfields');
const dashboardRouter = require('./admin/dashboard');
const backupRouter = require('./admin/backup');

router.use('/', authRouter);
router.use('/users', usersRouter);
router.use('/employees', employeesRouter);
router.use('/sections', sectionsRouter);
router.use('/custom-fields', customFieldsRouter);
router.use('/profile-sections', profileSectionsRouter);
router.use('/section-fields', sectionFieldsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/backup', backupRouter);

module.exports = router;