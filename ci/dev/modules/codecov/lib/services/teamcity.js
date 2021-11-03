module.exports = {

    detect: function () {
        return !!process.env.TEAMCITY_VERSION;
    },

    configuration: function () {
        console.log('    TeamCity CI Detected');
        return {
            service: 'teamcity',
            commit: process.env.BUILD_VCS_NUMBER,
            branch: process.env.BRANCH_NAME,
            build: process.env.BUILD_NUMBER
        };
    }

};